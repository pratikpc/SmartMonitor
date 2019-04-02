$.getJSON("/display/", function (data) {
    for (var count = 0; count < data.length; count++) {

        $("#accordion").accordion({ collapsible: true });

        var newH3 = document.createElement('h3');
        var newDiv = document.createElement('div');
        var acc = document.getElementById('accordion');

        newH3.innerText = data[count].name;//+' ('+data[count].Codes+')';

        var but2D = document.createElement('a');
        but2D.classList.add("btn", "btn-primary");
        but2D.setAttribute("role", "button");
        but2D.innerText = "Preview in 2D";
        //but2D.setAttribute('href', kml2DPath);
        //but2D.setAttribute('target', "_blank");

        // var but3D = document.createElement('a');
        // but3D.innerText = "Download in 3D";
        // but3D.classList.add("btn", "btn-primary");
        // but3D.setAttribute("role", "button");
        //but3D.setAttribute('href', kml3DPath);
        //but3D.setAttribute('download', "");
        //but3D.setAttribute('type', 'application/vnd.google-earth.kml+xml');

        acc.appendChild(newH3);
        acc.appendChild(newDiv);
        newDiv.appendChild(but2D);
        //newDiv.appendChild(but3D);
        $("#accordion").accordion("refresh");
    }
})