<?php

$file_key = 'file';

if(empty($_FILES) || ! isset($_FILES[$file_key])){
    echo('0');
    exit();
}

// Save
//$id = md5(uniqid(mt_rand(), true));
/*
$save_dir = 'files/';
if( ! file_exists($save_dir)){
    mkdir($save_dir);
}

$pathinfo = pathinfo($_FILES[$file_key]['name']);
$ext = (empty($pathinfo['extension'])) ? '' : '.' . $pathinfo['extension'];
$path = $save_dir . $id . $ext;

move_uploaded_file($_FILES[$file_key]['tmp_name'], $path);
*/

// Log
//file_put_contents('debug.log', $id . "\n". print_r($_FILES, true) . "\n\n",  FILE_APPEND);

echo('1');

?>
