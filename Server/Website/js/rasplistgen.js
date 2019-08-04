$(document).ready(() => {
    $.getJSON("/display/", (displays) => {
        addCheckbox(displays);
    });
});

var i = 0;
function addCheckbox(displays) {
    const dispId = document.getElementById("Displays");
    displays.forEach(display => {

        const checkbox = document.createElement("input");
        checkbox.setAttribute("type", "checkbox");
        checkbox.setAttribute("name", "ids");
        checkbox.setAttribute("value", display.id);
        checkbox.setAttribute("id", "checkBox" + i);
        checkbox.setAttribute("class", "allboxes");

        const label = document.createElement("label");
        label.innerText = display.name;
        label.setAttribute("for", "checkBox" + i);

        const div = document.createElement("div");
        div.appendChild(checkbox);
        div.appendChild(label);
        dispId.appendChild(div);

        i = i + 1;
    });
}
