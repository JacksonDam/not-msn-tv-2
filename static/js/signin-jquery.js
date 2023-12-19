$(document).ready(function() {
    const startup = $('#startup').get(0);
    const connecting = $('#connecting').get(0);
    const disconnect = $('#disconnect').get(0);
    const error = $('#error-sound').get(0);
    const signInPanel = $('#signin-panel');
    const signInProgressBar = $('#signin-bar');
    const errorDialog = $('#error-dialog');
    goToSpecific(0, 1, 1);
    var timeouts = [];
    timeouts.push(setTimeout(function() {
        startup.play();
    }, 500));
    timeouts.push(setTimeout(function() {
        $(".overlay").fadeOut(100);
    }, 4000));

    $(".sign-in-btn").on( "click", function(e) {
        e.stopPropagation();
        e.stopImmediatePropagation();
        for (var i= 0; i < timeouts.length; i++) {
            clearTimeout(timeouts[i]);
        }
        errorDialog.addClass("closed");
        errorDialog.find('.error-title-dark').removeClass("showing");
        errorDialog.find('.error-dialog-icon').removeClass("showing");
        errorDialog.find('.error-body').removeClass("showing");
        errorDialog.find('.btn-pair').removeClass("showing");
        signInPanel.addClass("open-no-anim");
        connecting.currentTime = 0;
        connecting.play();
        goToLayer(1);
        signInProgressBar.css('width', '0vh');
        timeouts.push(setTimeout(function () {
            signInProgressBar.css('width', '18vh');
        }, 500));
        timeouts.push(setTimeout(function () {
            signInProgressBar.css('width', '36vh');
        }, 1000));
        timeouts.push(setTimeout(function () {
            signInProgressBar.css('width', '54vh');
        }, 1500));
        timeouts.push(setTimeout(function () {
            signInProgressBar.css('width', '72vh');
        }, 2000));
        timeouts.push(setTimeout(function () {
            signInProgressBar.css('width', '90vh');
        }, 2500));
        timeouts.push(setTimeout(function () {
            signInProgressBar.css('width', '108vh');
        }, 3000));

        timeouts.push(setTimeout(function () {
            signInPanel.find('.panel-title-white').text("Home page not specified. Disconnected.")
            disconnect.currentTime = 0;
            disconnect.play();
            connecting.pause();
        }, 3000));

        timeouts.push(setTimeout(function () {
            signInPanel.removeClass("open-no-anim");
            signInPanel.find('.panel-title-white').text("Please wait while we sign you into MSN TV.")
            goToSpecific(0, 1, 1);
        }, 6000));
    });

    $(".network-icon").on("click", function(e) {
        e.stopPropagation();
        e.stopImmediatePropagation();
        for (var i= 0; i < timeouts.length; i++) {
            clearTimeout(timeouts[i]);
        }
        setLast();
        goToLayer(2);
        tempHideFocusBox();
        timeouts.push(setTimeout(function() {
            error.currentTime = 0;
            error.play();
            errorDialog.removeClass("closed");
            errorDialog.find('.error-title-dark').addClass("showing");
            errorDialog.find('.error-dialog-icon').addClass("showing");
            errorDialog.find('.error-body').addClass("showing");
            errorDialog.find('.btn-pair').addClass("showing");
        }, 250));
    });

    $(".cancel-error-btn").on("click", function(e) {
        e.stopPropagation();
        e.stopImmediatePropagation();
        errorDialog.addClass("closed");
        errorDialog.find('.error-title-dark').removeClass("showing");
        errorDialog.find('.error-dialog-icon').removeClass("showing");
        errorDialog.find('.error-body').removeClass("showing");
        errorDialog.find('.btn-pair').removeClass("showing");
        goToLast();
    });

    $(".custom-checkbox").on( "click", function(e) {
        e.stopPropagation();
        e.stopImmediatePropagation();
        if($(this).attr('data-checked') == "false") {
           $(this)
               .attr('src','/static/images/checked.png')
               .attr('data-checked', 'true');
        } else {
            $(this)
               .attr('src','/static/images/unchecked.png')
               .attr('data-checked', 'false');
        }
    });
});