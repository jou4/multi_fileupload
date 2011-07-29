var console = console || { log: function(msg){ } };
var textIcon = "assets/text.png",
    imageIcon = "assets/image.png",
    audioIcon = "assets/audio.png",
    movieIcon = "assets/movie.png",
    unknownIcon = "assets/unknown.png";
    
var _uploadFiles, _previewOnceNum = 4, _previewedNum, _isUploading = false;
var PageState = {
    SELECT: 0,
    READING: 1,
    PREVIEW: 2,
    UPLOADING: 3
};

var upload = function(){
    var targets = _uploadFiles, done = 0, total = targets.length, beginTime, isAbort = false,
        incr = function(){ ++done; };
    
    var updateStatus = function(){
        updateProgress(done / total * 100);
        $("#progressmsg").text("処理中...（" + done + " / " + total + "）");
        
        if(done == total){
            updatePage(PageState.SELECT);
            _isUploading = false;
            var endTime = (new Date()).getTime();
            var uploadSec = (endTime - beginTime) / 1000;
            alert("完了しました。（" + uploadSec + "秒）");
        }
    };
    
    var abort = function(){
        isAbort = true;
        updatePage(PageState.SELECT);
        _isUploading = false;
        alert("中止しました。");
    };
    
    var startThread = function(files){
        var i = 0, len = files.length, retry = 0,
            iter = function(){
                if(i < len){
                    var file = files[i++];
                    var fd = new FormData();
                    fd.append("file", file);
                    
                    $.ajax({
                        url: "receive.php",
                        type: "POST",
                        data: fd,
                        processData: false,
                        contentType: false,
                        success: function(){
                            if(isAbort){ return; }
                            
                            incr();
                            updateStatus();
                            retry = 0;
                            iter();
                        },
                        error: function(xhr, textStatus, errorThrown){
                            if(isAbort){ return; }
                            
                            console.log(xhr);
                            console.log(textStatus + ": " + errorThrown);
                            
                            if(xhr.status == 500 && retry < 3){
                                console.log("retry: " + file.name);
                                
                                i--;
                                retry++;
                                iter();
                            }else{
                                // 同ファイルで3回リトライしても失敗した場合は終了
                                alert("「" + file.name + "」はエラーが発生したためアップロードできませんでした。");
                                
                                if(confirm("残りのファイルのアップロード処理を続けますか？")){
                                    iter();
                                }else{
                                    // 中止
                                    abort();
                                }
                            }
                        }
                    });
                }else{
                    // complete
                    incr();
                    updateStatus();
                }
            };
        iter();
    };
    
    // スレッドに配布するファイルリストを作成
    var tnum = $("#threadnum").val(), tpool = [];
    for(var i=0; i<tnum; ++i){ tpool.push([]); }
    for(var i=0; i<total; ++i){ tpool[i % tnum].push(targets[i]); }
    
    // 状態を初期化した後に各スレッドを開始
    updateStatus();
    updatePage(PageState.UPLOADING);
    beginTime = (new Date()).getTime();
    _isUploading = true;
    
    for(var i=0; i<tnum; ++i){
        startThread(tpool[i]);
    }
};

var createIcon = function(file, callback){
    var fileType = getFileType(file);
    
    var iconpnl = document.createElement("div");
    iconpnl.className = "iconpnl";
    $('#preview').append(iconpnl);
    
    var imgpnl = document.createElement("div");
    imgpnl.className = "imgpnl";
    iconpnl.appendChild(imgpnl);
    
    var img = new Image();
    imgpnl.appendChild(img);
    
    var name = document.createElement("div");
    name.className = "name";
    $(name).text(file.name);
    iconpnl.appendChild(name);
    
    
    switch(fileType){
        case "text":
            img.src = textIcon;
            break;
        case "audio":
            img.src = audioIcon;
            break;
        case "movie":
            img.src = movieIcon;
            break;
        case "image":
            img.src = imageIcon;
            try{
                readFile(file, function(content){
                    img.src = content;
                    if(callback){ callback(); }
                });
            }catch(e){
                if(callback){ callback(); }
            }
            return;
        default:
            img.src = unknownIcon;
            break;
    }
    
    if(callback){ callback(); }
};

var readFile = function(file, callback){
    var reader = new FileReader();
    
    reader.onload = function(e){
        if(callback){
            callback(reader.result);
        }
    };
    
    reader.onerror = function() {
        switch (reader.error.code) {
            case FileError.NOT_FOUND_ERR:
                alert("ファイルが見つかりません:" + file.name);
                break;
            case FileError.NOT_READABLE_ERR:
                alert("ファイルを読み込めません:" + file.name);
                break;
            case FileError.SECURITY_ERR:
                alert("セキュリティエラー:" + file.name);
                break;
            case FileError.ABORT_ERR:
                alert("読み込みが中断されました:" + file.name);
                break;
            //case FileError.ENCODING_ERR:
            //  alert("不正なエンコーディングです:" + file.name);
            //  break;
        }
    };
    
    reader.readAsDataURL(file);
};

var preview = function(){
    updatePage(PageState.READING);
    
    var files = _uploadFiles;
    var count = 0,
        iter = function(){
            if(count++ < _previewOnceNum){
                if(_previewedNum < files.length){
                    createIcon(files[_previewedNum++], iter);
                }else{
                    // complete
                    updatePage(PageState.PREVIEW);
                }
            }else{
                $("#previewcontrols").show();
                updatePage(PageState.PREVIEW);
            }
        };
    iter();
};

var handleFiles = function(files){
    if(files.length == 0){ return; }
    
    _uploadFiles = files;
    _previewedNum = 0;
    
    $("#selectmsg").text(_uploadFiles.length + "個のファイルを選択しました。");
    preview();
};

var init = function(){
    $("#morepreview").click(preview);
    $("#upload").click(function(){
        if(confirm("アップロードしても良いですか？")){
            upload();
        }
    });
    $("#cancel").click(function(){
        updatePage(PageState.SELECT);
    });
    
    $("#progressbar").progressbar();
    
    updatePage(PageState.SELECT);
};

var updatePage = function(mode){
    switch(mode){
        case PageState.SELECT:
            $("#fileSelectPnl").show();
            $("#filePreviewPnl").hide();
            $("#previewcontrols").show();
            $("#uploadStatePnl").hide();
            
            $("#selector").get(0).value = "";
            $("#preview").empty();
            break;
        case PageState.READING:
            $("#fileSelectPnl").hide();
            $("#filePreviewPnl").show();
            $("#uploadStatePnl").hide();
            
            $("#previewcontrols").hide();
            $("#upload").attr("disabled", true);
            $("#cancel").attr("disabled", true);
            break;
        case PageState.PREVIEW:
            $("#fileSelectPnl").hide();
            $("#filePreviewPnl").show();
            $("#uploadStatePnl").hide();
            
            $("#upload").attr("disabled", false);
            $("#cancel").attr("disabled", false);
            break;
        case PageState.UPLOADING:
            $("#fileSelectPnl").hide();
            $("#filePreviewPnl").hide();
            $("#uploadStatePnl").show();
            
            updateProgress(0);
            break;
    }
};

var updateProgress = function(value){
    $("#progressbar").progressbar("value", value);
};

$(function(){
    init();
    
    var selector = document.getElementById("selector");
    $("#selector").change(function(){
        handleFiles(this.files);
    });
    
    $("#holder")
        .bind("dragover", function(){
            this.className = 'hover';
            return false;
        })
        .bind("dragend", function(){
            this.className = '';
            return false;
        })
        .bind("drop", function(e){
            this.className = '';
            handleFiles(e.originalEvent.dataTransfer.files);
            e.preventDefault();
            return false;
        });
    
    $(window).bind('beforeunload', function(e){
        if(_isUploading){
            return "アップロード処理中です。このままページを移動すると処理が中止されますが、良いですか？";
        }
    });
});

var getFileType = function(file){
    var imageType = /image.*/,
        videoType = /video.*/,
        audioType = /audio/,
        textType = /text.*/;
    
    if(file.type.match(imageType)){
        return "image";
    }
    else if(file.type.match(videoType)){
        return "video";
    }
    else if(file.type.match(audioType)){
        return "audio";
    }
    else if(file.type.match(textType)){
        return "text";
    }
    
    return null;
};
