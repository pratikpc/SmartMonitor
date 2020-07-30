function LoadUserList() {
    $('#tabtab').empty();
    $.getJSON('/user/', function (user) {
        var tab = document.createElement('table');
        tab.classList.add("table", "table-styling", "table-striped", "table-hover");
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

        for (var i = 0; i < user.length; ++i) {
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
}

function ShowError(msg) {
    document.getElementById("errorid").innerText = msg;
}

$(document).ready(function () {
    LoadUserList();
});

$("#addForm").submit(function (e) {
    const name = document.getElementById("name").value;
    e.preventDefault();
    $.ajax({
        method: "POST",
        url: "/user/add",
        dataType: "json",
        data: { name: name },
        success: function (data) {
            const success = Boolean(data.success);
            console.log(success, data);
            if (!success)
                return ShowError("Unable to Add User!!!");
            const password = String(data.password);
            ShowError("");
            ShowError("User Created. Password: " + password);
            LoadUserList();
        },
        error: function (jqXHR, exception) {
            ShowError("Unable to Add User!!!");
        }
    });
});

