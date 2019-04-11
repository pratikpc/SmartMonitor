$.getJSON("/display/", function (data) {
    Object.keys(data).forEach(function (count) {

        $("#accordion").accordion({ collapsible: true, heightStyle: "content" });

        var newH3 = document.createElement('h3');
        var rowDiv = document.createElement('div');
        var acc = document.getElementById('accordion');
        rowDiv.setAttribute("id", "acc-div");
        newH3.innerText = data[count].name;

        rowDiv.classList.add("row", "text-center", "text-lg-left");

        var id = data[count].id;
        var path = "/display/" + id + "/files";
        $.getJSON(path, function (photo) {
            for (var i = 0; i < photo.data.length; i++) {

                var iden2 = photo.data[i].file;
                var dispstat = photo.data[i].OnDisplay;
                console.log(dispstat);

                var gridDiv = document.createElement('div');
                gridDiv.classList.add("col-lg-3", "col-md-4", "col-6");

                var aBlock = document.createElement('a');
                aBlock.classList.add("d-block", "mb-4");

                var imgBlock = document.createElement('img');
                var imgpath = "/files/thumbnail?file=" + iden2 + "&id=" + id;
                imgBlock.setAttribute("src", imgpath);
                aBlock.classList.add("img-fluid", "img-thumbnail");

                var butHide = document.createElement('a');
                butHide.classList.add("btn", "btn-primary");
                butHide.setAttribute("role", "button");
                butHide.setAttribute("data-id", id);
                butHide.setAttribute("data-file", iden2);
                butHide.setAttribute("data-OnDisplay", dispstat)
                if (dispstat) { butHide.innerText = "Hide"; }
                else { butHide.innerText = "Show"; }
                butHide.onclick = function (button) {
                    console.log(button.target);
                    var chng = (button.target.innerText === "Hide");
                    var fileId = button.target.getAttribute("data-file");
                    var displayId = button.target.getAttribute("data-id");
                    $.ajax({
                        url: '/files/shown', type: 'PUT', dataType: "json",
                        data: { file: fileId, id: displayId, show: !chng },
                        success: function (data) {
                            console.log(data, fileId, chng);
                            const success = Boolean(data.success);
                            if (success === false) {
                                console.error("Unable to hide");
                                return;
                            }
                            if (button.target.innerText === "Hide")
                                button.target.innerText = "Show";
                            else
                                button.target.innerText = "Hide";
                        },
                        error: function (jqXHR, exception) {
                            console.error("Unable to hide");
                        }
                    });
                };

                var butDel = document.createElement('a');
                butDel.classList.add("btn", "btn-primary");
                butDel.setAttribute("role", "button");
                butDel.onclick = function () {
                    $.ajax({
                        url: '/files/remove' + $.param({ file: iden2, id: id }),
                        type: 'DELETE'
                    });
                };
                butDel.innerText = "Delete";

                aBlock.appendChild(imgBlock);
                gridDiv.appendChild(aBlock);
                gridDiv.appendChild(butHide);
                gridDiv.appendChild(butDel);
                rowDiv.appendChild(gridDiv);
            }
        });

        acc.appendChild(newH3);
        acc.appendChild(rowDiv);
        $("#accordion").accordion("refresh");
    });
});