document.addEventListener('DOMContentLoaded', () => {
    //Find btn ID in HTML 
    const enterBtn = document.getElementById('btn-primary');
    //Check if the button exists to avoid errors
    if (enterBtn) {
        enterBtn.addEventListener('click', () => {
            //Redirect to office.html when the button is clicked
            window.location.href = 'office.html';
        });
    }
});
