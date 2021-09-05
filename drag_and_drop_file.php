<?php

defined('_JEXEC');

require_once COM_FABRIK_FRONTEND . '/models/plugin-list.php';

class PlgFabrik_ListDrag_and_drop_file extends PlgFabrik_List
{

    public function button(&$args)
    {
        //parent::button($args);
        return false;
    }

    public function getRequiredFields() {
        $params = $this->getParams();

        $requiredFields = json_decode($params->get('required_fields'));

        $model = FabrikWorker::getPluginManager();

        $fields = $requiredFields->dadf_field;
        $values = $requiredFields->dadf_value;

        $return = array();

        $i = 0;
        foreach ($fields as $field) {
            $elModel = $model->getElementPlugin($field)->element;
            $return[$elModel->name] = $values[$i];
            $i++;
        }

        return $return;
    }

    public function onloadJavascriptInstance($args)
    {
        $params = $this->getParams();

        $elId = $params->get('dadf_arquivo');
        $elModel = FabrikWorker::getPluginManager()->getElementPlugin($elId)->element;

        $app = $this->app;
        $input = $app->input;
        $itemId = $input->get('Itemid');
        $formId = $this->getModel()->getFormModel()->getId();

        $baseUrl = $app->getDocument()->base;
        if ($baseUrl) {
            $baseUrl .= "/form/{$formId}/";
        }
        else {
            $baseUrl = COM_FABRIK_LIVESITE . "index.php?Itemid={$itemId}&option=com_fabrik&view=form&formid={$formId}&rowid=";
        }


        $opts             = $this->getElementJSOptions();
        $opts->elModel = $elModel;
        $opts->base_dir = JPATH_BASE;
        $opts->table = $this->getModel()->getTable()->db_table_name;
        $opts->formUrl = $baseUrl;
        $opts->requiredFields = $this->getRequiredFields();

        $opts             = json_encode($opts);

        $this->jsInstance = "new FbListDrag_and_drop_file($opts)";

        return true;
    }

    public function loadJavascriptClassName_result()
    {
        return 'FbListDrag_and_drop_file';
    }

    public function existsFile($dir, $fileName) {
        $extension = end(explode('.', $fileName));
        $original_name = str_replace(".{$extension}", '', $fileName);
        $original_name = mb_ereg_replace("([^\w\s\d\-_~,;\[\]\(\).])", '', $original_name);
        $original_name = mb_ereg_replace("([\.]{2,})", '', $original_name);
        $original_name = str_replace(' ', '_', $original_name);

        $actual_name = $original_name;

        $i = 1;
        while(JFile::exists("{$dir}/{$actual_name}.{$extension}"))
        {
            $actual_name = (string) "{$original_name}({$i})";
            $i++;
        }

        return "{$actual_name}.{$extension}";
    }

    public function makeThumbOrCrop($path, $path_tc, $width, $height, $extension)
    {
        $result = false;

        list($old_width, $old_height) = getimagesize($path);
        $image_tmp = imagecreatetruecolor($width, $height);
        if ($extension === 'jpg') {
            $image_original = imagecreatefromjpeg($path);
            imagecopyresampled($image_tmp, $image_original, 0, 0, 0, 0, $width, $height, $old_width, $old_height);
            $result = imagejpeg($image_tmp, $path_tc);
        }
        else if ($extension === 'png') {
            $image_original = imagecreatefrompng($path);
            imagecopyresampled($image_tmp, $image_original, 0, 0, 0, 0, $width, $height, $old_width, $old_height);
            $result = imagepng($image_tmp, $path_tc);
        }
        else if ($extension === 'gif') {
            $image_original = imagecreatefromgif($path);
            imagecopyresampled($image_tmp, $image_original, 0, 0, 0, 0, $width, $height, $old_width, $old_height);
            $result = imagegif($image_tmp, $path_tc);
        }

        imagedestroy($image_original);
        imagedestroy($image_tmp);

        return $result;
    }

    public function makePdfThumb($path, $path_thumb, $width, $height) {
        $im = new Imagick($path . '[0]');
        $im->setImageFormat("png");
        $im->setImageBackgroundColor(new ImagickPixel('white'));
        $im->thumbnailImage($width, $height);
        $im->writeImage($path_thumb);
    }

    public function onUploadFile() {
        $fileName = $_FILES['file']['name'];
        $fileType = $_FILES['file']['type'];
        $fileContent = file_get_contents($_FILES['file']['tmp_name']);

        $params = json_decode($_REQUEST['params']);
        $base_dir = $_REQUEST['base_dir'];
        $dir = "{$base_dir}/{$params->ul_directory}/";
        $dir_thumb = "{$base_dir}/{$params->thumb_dir}/";
        $dir_crop = "{$base_dir}/{$params->fileupload_crop_dir}/";

        $fileName = $this->existsFile($dir, $fileName);

        if (JFile::write($dir . $fileName, $fileContent)) {
            $path_return = realpath($dir . $fileName);
            $path_return = str_replace($base_dir, '', $path_return);

            if ($fileType === 'image/gif') {
                $extension = 'gif';
            }
            else if ($fileType === 'image/jpeg') {
                $extension = 'jpg';
            }
            else if ($fileType === 'image/png') {
                $extension = 'png';
            }
            else if ($fileType === 'application/pdf') {
                $extension = 'pdf';
            }

            if (($extension === 'pdf') && ((bool) $params->fu_make_pdf_thumb)) {
                $this->makePdfThumb($dir . $fileName, $dir_thumb . $fileName, $params->thumb_max_width, $params->thumb_max_height);
            }
            else if ($extension) {
                if ((bool) $params->make_thumbnail) {
                    $this->makeThumbOrCrop($dir . $fileName, $dir_thumb . $fileName, $params->thumb_max_width, $params->thumb_max_height, $extension);
                }
                if ((bool) $params->fileupload_crop) {
                    $this->makeThumbOrCrop($dir . $fileName, $dir_crop . $fileName, $params->fileupload_crop_width, $params->fileupload_crop_height, $extension);
                }
            }

        }

        echo json_encode($path_return);
    }

    public function onCreateRow() {
        $files = $_POST['files'];
        $table = $_POST['table'];
        $elName = $_POST['elName'];
        $params = json_decode($_POST['params']);
        $requiredFields = $_POST['requiredFields'];

        $db = JFactory::getDbo();

        $new = array();
        $new = array_merge($new, $requiredFields);
        $new['id'] = 0;
        if (!(bool) $params->ajax_upload) {
            $new[$elName] = $db->escape($files[0]);
        }
        $new = (Object) $new;
        $db->insertObject($table, $new, 'id');

        $rowId = $db->insertid();

        if ((bool) $params->ajax_upload) {
            foreach ($files as $file) {
                $table_repeat = "{$table}_repeat_{$elName}";
                $new_repeat = array();
                $new_repeat['id'] = 0;
                $new_repeat['parent_id'] = $rowId;
                $new_repeat[$elName] = $file;
                $new_repeat = (Object) $new_repeat;
                $db->insertObject($table_repeat, $new_repeat, 'id');
            }
        }

        echo json_encode($rowId);
    }
}