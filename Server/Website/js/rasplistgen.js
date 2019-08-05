$(document).ready(() => {
    $.getJSON("/display/", (displays) => {
        addCheckbox(displays);
    });
});

function addCheckbox(displays) {
    let i = 0;
    const dispId = document.getElementById("Displays");
    displays.forEach(display => {

        const checkbox = document.createElement("input");
        checkbox.setAttribute("type", "checkbox");
        checkbox.setAttribute("name", "ids");
        checkbox.setAttribute("value", display.id);
        checkbox.setAttribute("id", "checkBox" + i);
        checkbox.setAttribute("class", "allboxes");
        checkbox.setAttribute("required", "");
        checkbox.setAttribute("onclick","VerifyIfSubmitEnabled();");

        const label = document.createElement("label");
        label.innerText = display.name;
        label.setAttribute("for", "checkBox" + i);

        const li = document.createElement("li");
        // li.classList.add("list-group-item");
        li.appendChild(checkbox);
        li.appendChild(label);
        dispId.appendChild(li);

        i = i + 1;
    });
}
