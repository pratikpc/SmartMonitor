function ShowError(msg) {
    document.getElementById("errorid").innerText = msg;
}
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
            if (success === false)
                return ShowError("Unable to Add User!!!");
            const password = String(data.password);
            ShowError("");
            ShowError("User Created. Password: "+password);
        },
        error: function (jqXHR, exception) {
            ShowError("Unable to Add User!!!");
        }
    });
});