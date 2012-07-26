$(window).ready(function() {
  if(window.opener) {
    window.close();
    window.opener.location.reload(true);
  }

  $('.facebook-logout').click(function(event) {
    FB.getLoginStatus(handleSessionResponse);
  });
});


// handle a session response from any of the auth related calls
function handleSessionResponse(response) {
  // if we dont have a session (which means the user has been logged out, redirect the user)
  if(response.status === 'connected') {
    FB.logout(function() {
      location.href = "/users/sign_out"
    });
  }  
}