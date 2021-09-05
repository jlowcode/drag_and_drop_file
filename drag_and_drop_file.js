define(['jquery', 'fab/list-plugin'], function (jQuery, FbListPlugin) {
    var FbListDrag_and_drop_file = new Class({
        Extends   : FbListPlugin,
        initialize: function (options) {
            this.parent(options);
            this.options.filesUploaded = [];
            var self = this;
            var body = document.getElementById('g-expanded');
            var inp = document.createElement('input');
            inp.setAttribute('type', 'hidden');
            inp.setAttribute('id', 'requestCounter');
            inp.setAttribute('value', '0');
            body.appendChild(inp);
            this.insertDragOver();

            var counter = 0;
            body.ondrop = function (e) {
                self.dropHandler(e);
            }
            body.ondragenter = function (e) {
                counter++;
                var dragover_area = document.getElementById('dragover_area');
                dragover_area.style.display = "block";
            }
            body.ondragover = function (e) {
                self.dragOverHandler(e);
            }
            body.ondragleave = function (e) {
                counter--;
                if (counter === 0) {
                    var dragover_area = document.getElementById('dragover_area');
                    dragover_area.style.display = "none";
                }
            }

        },
        insertDragOver: function() {
            var body = document.getElementById('g-expanded');
            var div_dragover = document.createElement('div');
            div_dragover.setAttribute('id', 'dragover_area');
            div_dragover.setAttribute('style', 'width: 90%; height:90%; position: absolute; opacity: 0.9; top: 5%; left: 5%; z-index: 100; text-align: center; background-color: white; border-style: dashed; box-shadow: inset 0 3px 4px #888; border-color: #58D3F7');
            div_dragover.style.display = "none";

            var img = document.createElement('img');
            img.setAttribute('id', 'dragover_area_img');
            img.setAttribute('src', 'https://cdn.icon-icons.com/icons2/495/PNG/512/upload-computer_icon-icons.com_48408.png');
            img.setAttribute('style', 'width: 200px; height: 200px');

            var caption = document.createElement('figcaption');
            caption.setAttribute('id', 'dragover_area_caption');
            caption.innerHTML = "Solte arquivos aqui";

            var p = document.createElement('p');
            p.setAttribute('id', 'dragover_text');
            p.setAttribute('style', 'color: darkgrey; font-size: 40px; position: fixed; width: 90%;');

            var figure = document.createElement('figure');
            figure.setAttribute('style', 'width: 90%;');
            figure.appendChild(img);
            figure.appendChild(caption);

            p.appendChild(figure);

            div_dragover.appendChild(p);
            body.appendChild(div_dragover);
        },
        dragOverHandler: function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
        },
        dropHandler: function (ev) {
            ev.preventDefault();
            ev.stopPropagation();

            var dragover_area_img = document.getElementById('dragover_area_img');
            var dragover_area_caption = document.getElementById('dragover_area_caption');
            dragover_area_img.setAttribute('src', 'https://www.voya.ie/Interface/Icons/LoadingBasketContents.gif');
            dragover_area_caption.innerHTML = "Carregando arquivo";

            var i;
            if (ev.dataTransfer.items) {
                this.options.tamFiles = ev.dataTransfer.items.length;
                for (i = 0; i < ev.dataTransfer.items.length; i++) {
                    if (ev.dataTransfer.items[i].kind === 'file') {
                        this.uploadFile(ev.dataTransfer.items[i].getAsFile(), i+1);
                    }
                }
            } else {
                this.options.tamFiles = ev.dataTransfer.files.length;
                for (i = 0; i < ev.dataTransfer.files.length; i++) {
                    this.uploadFile(ev.dataTransfer.files[i], i+1);
                }
            }
        },
        uploadFile: function (file, count) {
            var self = this;

            var fd = new FormData();
            fd.append("file", file);
            fd.append('option', 'com_fabrik');
            fd.append('format', 'raw');
            fd.append('task', 'plugin.pluginAjax');
            fd.append('plugin', 'drag_and_drop_file');
            fd.append('method', 'uploadFile');
            fd.append('g', 'list');
            fd.append('params', this.options.elModel.params);
            fd.append('base_dir', this.options.base_dir);

            var xhr = new XMLHttpRequest();
            xhr.open('POST', Fabrik.liveSite + 'index.php', true);

            xhr.upload.onprogress = function(e) {
                if (e.lengthComputable) {
                    var percentComplete = (e.loaded / e.total) * 100;
                }
            };

            xhr.onload = function() {
                if (this.status === 200) {
                    var resp = JSON.parse(this.response);
                    self.options.filesUploaded.push(resp);

                    if (count === self.options.tamFiles) {
                        self.createRow();
                    }

                    /*var image = document.createElement('img');
                    image.src = resp.dataUrl;
                    document.body.appendChild(image);*/
                }
            };

            xhr.send(fd);
        },
        createRow: function () {
            var self = this;
            jQuery.ajax ({
                url: Fabrik.liveSite + 'index.php',
                method: "POST",
                data: {
                    'option': 'com_fabrik',
                    'format': 'raw',
                    'task': 'plugin.pluginAjax',
                    'plugin': 'drag_and_drop_file',
                    'method': 'createRow',
                    'g': 'list',
                    'files': self.options.filesUploaded,
                    'table': self.options.table,
                    'elName': self.options.elModel.name,
                    'params': self.options.elModel.params,
                    'requiredFields': self.options.requiredFields
                }
            }).done (function (data) {
                window.location.href = self.options.formUrl + data;
            });
        }
    });

    return FbListDrag_and_drop_file;
});