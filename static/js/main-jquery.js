const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function start() {
    const startup = $('#startup').get(0);
    const connecting = $('#connecting').get(0);
    const disconnect = $('#disconnect').get(0);
    const homeBrand = $('#home-brand').get(0);
    const error = $('#error-sound').get(0);
    const signInPanel = $('#signin-panel');
    const signInProgressBar = $('#signin-bar');
    const errorDialog = $('#error-dialog');
    const statusBar = $('#status-bar');
    const spinner = $('#status-bar-spinner');
    const curPage = $('#cur-page')
    goToSpecific(0, 1, 1);
    var timeouts = [];
    timeouts.push(setTimeout(function() {
        startup.play();
    }, 500));
    timeouts.push(setTimeout(function() {
        $(".overlay").fadeOut(100);
    }, 4000));

    function signInReset() {
        signInPanel.find('.panel-title-white').text("Please wait while we sign you in to MSN TV.");
        signInPanel.removeClass("open-status-no-anim");
        errorDialog.addClass("closed");
        errorDialog.find('.error-title-dark').removeClass("showing");
        errorDialog.find('.error-dialog-icon').removeClass("showing");
        errorDialog.find('.error-body').removeClass("showing");
        errorDialog.find('.btn-pair').removeClass("showing");
        statusBar.addClass("hidden");
        spinner.removeClass('hidden');
        statusBar.find('.scroll-arrow-down').addClass("hidden");
        statusBar.find('.sb-overlay').removeClass('overlaying');
        spinner.css('transform', 'rotate(0deg)');
        signInPanel.addClass("open-no-anim");
    }

    function getPage() {
        $.get('/tv/request-page',
            {'query': 'home'},
              function(data) {
                  console.log(data);
                  curPage.html(data)
        })
        .done(function() {
            var date = new Date();
            const month = date.getMonth();
            const day = date.getDate();
            const year = date.getFullYear();
            $('.today-pane-date').html(months[month] + " " + day + ", " + year);
            initialiseSelectables(curPage);
        });
    }

    function signInClose() {
        curPage.removeClass("hidden");
        signInPanel.removeClass("open-status-no-anim");
        signInPanel.addClass("closed-no-anim");
    }

    $(".sign-in-btn").on( "click", function(e) {
        e.stopPropagation();
        e.stopImmediatePropagation();
        for (var i= 0; i < timeouts.length; i++) {
            clearTimeout(timeouts[i]);
        }
        signInReset();
        connecting.currentTime = 0;
        connecting.play();
        goToLayer(1);
        signInProgressBar.css('width', '0vh');
        timeouts.push(setTimeout(function () {
            signInProgressBar.css('width', '106vh');
        }, 300));
        timeouts.push(setTimeout(function () {
            signInProgressBar.css('width', '10.6vh');
        }, 400));
        timeouts.push(setTimeout(function () {
            signInProgressBar.css('width', '50vh');
        }, 500));
        timeouts.push(setTimeout(function () {
            hideFocusBox();
            signInPanel.removeClass("open-no-anim");
        }, 1300));
        timeouts.push(setTimeout(function () {
            signInProgressBar.css('width', '42vh');
            statusBar.removeClass("hidden");
            statusBar.find('.scroll-arrow-down').removeClass("hidden");
            statusBar.find('.sb-overlay').addClass('overlaying');
            signInPanel.find('.panel-title-white').text("Contacting MSN TV Service");
        }, 1400));
        timeouts.push(setTimeout(function () {
            statusBar.find('.sb-overlay').removeClass('overlaying');
        }, 1900));
        timeouts.push(setTimeout(function () {
            signInPanel.addClass("open-status-no-anim");
            statusBar.find('.scroll-arrow-down').addClass("hidden");
        }, 1950));
        timeouts.push(setTimeout(function () {
            unHideFocusBox();
        }, 2050));
        timeouts.push(setTimeout(function () {
            hideFocusBox();
        }, 2450));
        timeouts.push(setTimeout(function () {
            signInProgressBar.css('width', '75vh');
            spinner.css('transform', 'rotate(30deg)');
        }, 4175));
        timeouts.push(setTimeout(function () {
            spinner.addClass('hidden');
        }, 4275));
        timeouts.push(setTimeout(function () {
            spinner.removeClass('hidden');
        }, 6075));
        timeouts.push(setTimeout(function () {
            spinner.addClass('hidden');
            getPage();
        }, 6175));
        timeouts.push(setTimeout(function () {
            signInClose();
        }, 7950));
        timeouts.push(setTimeout(function () {
            homeBrand.currentTime = 0;
            homeBrand.play();
            spinner.removeClass('hidden');
            unHideFocusBox();
        }, 8250));
        timeouts.push(setTimeout(function () {
            spinner.addClass('hidden');
        }, 8450));
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
        if($(this).attr('data-checked') === "false") {
            $(this)
               .attr('src','/static/images/checked.png')
               .attr('data-checked', 'true');
        }
        else {
            $(this)
               .attr('src','/static/images/unchecked.png')
               .attr('data-checked', 'false');
        }
    });

    setInterval(function() {
        var date = new Date();
        const hours = date.getHours();
        const mins = date.getMinutes();
        $('#status-bar-clock').html((hours % 12 || 12) + ":" + (mins < 10 ? '0' : '') + mins + (hours >= 12 ? 'pm' : 'am'));
    }, 1000);
}