//showing cursor onload the file
            theFormID.theFieldID.focus();
     
		$(document).ready(function(){
        
        // Showing disable button writing a text in input field
			$(document.body).on('input','#theFieldID', function(){
				// console.log($(this).val());
				if($(this).val() != "")
				{
				    $('#submit_on').attr('disabled',false);
				}
				else{
					// alert('asd');
					$('#submit_on').attr('disabled',true);
				};
				
			});
		});