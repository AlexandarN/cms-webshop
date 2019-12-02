<?php 
$errors = '';

$myemail = 'example@yourwebsite.com';//<-----Put Your email address here.
if(empty($_POST['name'])  ||
   empty($_POST['phone']) ||
   empty($_POST['email']) || 
   empty($_POST['subject']) || 
   empty($_POST['message']))
{
    $errors .= "\n Error: all fields are required";
}

$name = $_POST['name']; 
$phone = $_POST['phone'];
$email_address = $_POST['email']; 
$subject = $_POST['subject']; 
$message = $_POST['message']; 

	$to = $myemail;
    $phone = $phone;
	$email_subject = $subject;
	$email_body = "You have received a new message. ".
	" Here are the details:\n Name: $name \n Subject: $subject \n phone: $phone \n Email: $email_address \n Message: \n $message"; 
	
	$headers = "From: $myemail\n"; 
	$headers .= "Reply-To: $email_address";
	
	
$mail_sent = mail($to,$email_subject,$email_body,$headers);;
if ($mail_sent == true){ ?>    
<script language="javascript" type="text/javascript">  
if (window.alert('Thank you for the message. We will contact you shortly.'))
{
    
window.location = 'contact.html';	

}
else
{
window.history.back()
}
  
</script>    
<?php } else { ?> 
<script language="javascript" type="text/javascript">   
alert('Message not sent. Please, notify the site administrator admin@admin.com');  
window.location = 'contact-1.html'; 
</script>    
<?php     } ?> 
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd"> 
<html>
<head>
	<title>Contact form handler</title>
</head>

<body>
<!-- This page is displayed only if there is some error -->
<?php
echo nl2br($errors);
?>


</body>
</html>