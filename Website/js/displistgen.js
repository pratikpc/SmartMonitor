$.getJSON("/display/", function (data) {
    Object.keys(data).forEach(function (count) {

        $("#accordion").accordion({ collapsible: true, heightStyle: "content" });

        var newH3 = document.createElement('h3');
        var rowDiv = document.createElement('div');
        var acc = document.getElementById('accordion');
        rowDiv.setAttribute("id","acc-div");
        newH3.innerText = data[count].name;

        rowDiv.classList.add("row", "text-center", "text-lg-left");

        var id = data[count].id;
        var path = "/display/" + id + "/files";
        $.getJSON(path, function (photo) {
            for (var i = 0; i < photo.data.length; i++) {

                var iden2 = photo.data[i].file;
                var dispstat = photo.data[i].OnDisplay;
                console.log(dispstat);
                var chng = !dispstat; 

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
                butHide.setAttribute("data-OnDisplay",dispstat)
                if(dispstat)
                { butHide.innerText = "Hide"; }
                else { butHide.innerText = "Show"; }
                butHide.onclick = function() {$.ajax({
                    url: '/files/shown', type: 'PUT', contentType:'application/json', data:{"fileId": iden2, "DisplayId" : id, "OnDisplay":chng }
                    });};
                
                var butDel = document.createElement('a');
                butDel.classList.add("btn", "btn-primary");
                butDel.setAttribute("role", "button");
                butDel.onclick = function() {$.ajax({
                    url: '/files/remove' + $.param({"fileId": iden2, "DisplayId" : id}),
                    type: 'DELETE'});};
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