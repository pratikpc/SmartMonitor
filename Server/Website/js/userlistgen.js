$.getJSON('/user/', (user) => {
    var tab = document.createElement('table');
    tab.classList.add("table", "table-styling"); //Pending Testing
    var newthead = document.createElement('thead');
    tab.appendChild(newthead);
    var newtr = document.createElement('tr');
    newtr.classList.add("table-primary");
    newthead.appendChild(newtr);
    var newth = document.createElement('th');
    newth.innerText = "ID";
    newtr.appendChild(newth);
    var newth = document.createElement('th');
    newth.innerText = "User Name";
    newtr.appendChild(newth);
    var newtbody = document.createElement('tbody');
    tab.appendChild(newtbody);
    // newtbody.appendChild(newtr);
    for (var i = 0; i < user.length; ++i) {
        // if(i>3)
        //  continue;
        var newTR = document.createElement('tr');
        var id = document.createElement('td');
        id.appendChild(document.createTextNode(i + 1));
        newTR.appendChild(id);
        var username = document.createElement('td');
        username.appendChild(document.createTextNode(user[i].name));
        newTR.appendChild(username);
        newtbody.appendChild(newTR);
    }
    $('#tabtab').append(tab);
});
