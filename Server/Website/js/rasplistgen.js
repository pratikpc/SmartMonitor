$(document).ready(() => {
    $.getJSON("/display/", (displays) => {
        addCheckbox(displays);
    });
});

function addCheckbox(displays) {
    const dispId = document.getElementById("Displays");
    displays.forEach(display => {
        const checkbox = document.createElement("input");
        checkbox.setAttribute("type", "checkbox");
        checkbox.setAttribute("name", "ids");
        checkbox.setAttribute("value", display.id);

        const label = document.createElement("label");
        label.innerText = display.name;

        const div = document.createElement("div");
        div.appendChild(checkbox);
        div.appendChild(label);
        dispId.appendChild(div);
    });
}
