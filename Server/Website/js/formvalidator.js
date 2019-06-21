$(document).on('change', '#xyz', function () {
    if (document.getElementById('xyz').hasAttribute('disabled')) {
        $('#submit_on').removeProp('disabled');
    }
    else {
        $('#submit_on').prop('disabled', true);
    }
});
//$('#submit').removeAttr('disabled');