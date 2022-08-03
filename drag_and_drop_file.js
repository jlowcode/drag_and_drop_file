define(["jquery", "fab/list-plugin"], function (e, t) {
    return new Class({
        Extends: t,
        initialize: function (e) {
            this.parent(e), (this.options.filesUploaded = []);
            var t = this,
                a = document.body,
                i = document.createElement("input");
            i.setAttribute("type", "hidden"), i.setAttribute("id", "requestCounter"), i.setAttribute("value", "0"), a.appendChild(i), this.insertDragOver();
            var n = 0;
            (a.ondrop = function (e) {
                t.dropHandler(e);
            }),
                (a.ondragenter = function (e) {
                    n++, (document.getElementById("dragover_area").style.display = "block");
                }),
                (a.ondragover = function (e) {
                    t.dragOverHandler(e);
                }),
                (a.ondragleave = function (e) {
                    0 == --n && (document.getElementById("dragover_area").style.display = "none");
                });
        },
        insertDragOver: function () {
            var e = document.body,
                t = document.createElement("div");
            t.setAttribute("id", "dragover_area"),
                t.setAttribute(
                    "style",
                    "width: 90%; height:90%; position: absolute; opacity: 0.9; top: 5%; left: 5%; z-index: 100; text-align: center; background-color: white; border-style: dashed; box-shadow: inset 0 3px 4px #888; border-color: #58D3F7"
                ),
                (t.style.display = "none");
            var a = document.createElement("img");
            a.setAttribute("id", "dragover_area_img"), a.setAttribute("src", "plugins/fabrik_list/drag_and_drop_file/images/upload-computer_icon-icons.com_48408.png"), a.setAttribute("style", "width: 200px; height: 200px");
            var i = document.createElement("figcaption");
            i.setAttribute("id", "dragover_area_caption"), (i.innerHTML = "Solte arquivos aqui");
            var n = document.createElement("p");
            n.setAttribute("id", "dragover_text"), n.setAttribute("style", "color: darkgrey; font-size: 40px; position: fixed; width: 90%;");
            var r = document.createElement("figure");
            r.setAttribute("style", "width: 90%;"), r.appendChild(a), r.appendChild(i), n.appendChild(r), t.appendChild(n), e.appendChild(t);
        },
        dragOverHandler: function (e) {
            e.preventDefault(), e.stopPropagation();
        },
        dropHandler: function (e) {
            e.preventDefault(), e.stopPropagation();
            var t,
                a = document.getElementById("dragover_area_img"),
                i = document.getElementById("dragover_area_caption");
            if ((a.setAttribute("src", "https://www.voya.ie/Interface/Icons/LoadingBasketContents.gif"), (i.innerHTML = "Carregando arquivo"), e.dataTransfer.items))
                for (this.options.tamFiles = e.dataTransfer.items.length, t = 0; t < e.dataTransfer.items.length; t++) "file" === e.dataTransfer.items[t].kind && this.uploadFile(e.dataTransfer.items[t].getAsFile(), t + 1);
            else for (this.options.tamFiles = e.dataTransfer.files.length, t = 0; t < e.dataTransfer.files.length; t++) this.uploadFile(e.dataTransfer.files[t], t + 1);
        },
        uploadFile: function (e, t) {
            var a = this,
                i = new FormData();
            i.append("file", e),
                i.append("option", "com_fabrik"),
                i.append("format", "raw"),
                i.append("task", "plugin.pluginAjax"),
                i.append("plugin", "drag_and_drop_file"),
                i.append("method", "uploadFile"),
                i.append("g", "list"),
                i.append("params", this.options.elModel.params),
                i.append("base_dir", this.options.base_dir);
            var n = new XMLHttpRequest();
            n.open("POST", Fabrik.liveSite + "index.php", !0),
                (n.upload.onprogress = function (e) {
                    e.lengthComputable && (e.loaded, e.total);
                }),
                (n.onload = function () {
                    if (200 === this.status) {
                        var e = JSON.parse(this.response);
                        a.options.filesUploaded.push(e), t === a.options.tamFiles && a.createRow();
                    }
                }),
                n.send(i);
        },
        createRow: function () {
            var t = this;
            e.ajax({
                url: Fabrik.liveSite + "index.php",
                method: "POST",
                data: {
                    option: "com_fabrik",
                    format: "raw",
                    task: "plugin.pluginAjax",
                    plugin: "drag_and_drop_file",
                    method: "createRow",
                    g: "list",
                    files: t.options.filesUploaded,
                    table: t.options.table,
                    elName: t.options.elModel.name,
                    params: t.options.elModel.params,
                    requiredFields: t.options.requiredFields,
                },
            }).done(function (e) {
                window.location.href = t.options.formUrl + e;
            });
        },
    });
});
