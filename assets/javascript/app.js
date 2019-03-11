$(document).ready(function () {

    //Wait 2 seconds for database to connect.  If no connection
    //in 2 seconds then show a "Connecting..." message.
    var connectTimeout = setTimeout(function () {
        setText("connecting");
    }, 2000);

    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyAcP9S3JjEpexVzjSyN0FaqKJ0u9u-BGh4",
        authDomain: "rps-multiplayer-e4cdc.firebaseapp.com",
        databaseURL: "https://rps-multiplayer-e4cdc.firebaseio.com",
        projectId: "rps-multiplayer-e4cdc",
        storageBucket: "rps-multiplayer-e4cdc.appspot.com",
        messagingSenderId: "121830920883"
    };
    firebase.initializeApp(config);

    var database = firebase.database();

    var status = "begin";
    var opponentTimeout;
    var opponentCountdown;
    var countdownTime;
    var playCountdown;
    var playTimeout;
    var oppPlayCountdown;
    var oppPlayTimeout;
    var gameStatus = "";

    var player1LastUpdate = "";
    var player2LastUpdate = "";
    var player1 = false;
    var player2 = false;

    var isPlayerOne = false;
    var player1Pick = "";
    var player2Pick = "";
    var player1WinStatus = "";


    $(document).on("click", ".rps-img", function () {       //Selection of rock, paper or scissor
        clearTimeout(playTimeout);
        clearInterval(playCountdown);
        var selection = $(this).attr("data-val");
        var currentdate = new Date();

        

        player1Pick = selection;
        status = "selected";    

        //update database with selection and go to selected status
        if (isPlayerOne) {
            database.ref('/game').update({
                player_1_last_update: currentdate,
                player_1_pick: selection,
                player_1_pick_new: true
            })
        } else {
            database.ref('/game').update({
                player_2_last_update: currentdate,
                player_2_pick: selection,
                player_2_pick_new: true
            })
        }

        
        setText(status);

    })

    $(document).on("click", "#play_again_btn", function () {
        status = "gamebegins"

        var currentdate = new Date();

        if (isPlayerOne) {
            database.ref('/game').update({
                player_1_last_update: currentdate,
                player_1_pick: "",
                player_1_pick_new: false,
                start_time: currentdate,
            })
        } else {
            database.ref('/game').update({
                player_2_last_update: currentdate,
                player_2_pick: "",
                player_2_pick_new: false,
                start_time: currentdate
            })
        }

        setText("gamebegins")
    })

    $(document).on("click", "#start_btn", function () {

        //check to make sure you can still start a game
        status = getGameStatus();

        if (status === "nogame") {
            var currentdate = new Date();

            status = "waiting"
            isPlayerOne = true;
            database.ref('/game').update({
                player_1: true,
                player_1_last_update: currentdate,
                player_1_pick: "",
                start_time: currentdate,
                player_2: false,
                player_2_pick: ""
            })
            setText(status);
        } else {
            setText(status);
        }
    })


    $(document).on("click", "#join_btn", function () {
        var currentdate = new Date();

        database.ref('/game').update({
            player_2: true,
            player_2_last_update: currentdate,
            player_2_pick: "",
            start_time: currentdate
        })

        status = "gamebegins";
        setText(status);
    })

    database.ref("/game").on("value", function (snapshot) {

        if (!(snapshot.exists())) {
            database.ref().set({
                player_1: false,
                player_2: false,
                player_1_last_update: "",
                player_2_last_update: "",
                player_1_pick: "",
                player_2_pick: "",
                player_1_pick_new: false,
                player_2_pick_new: false,
                start_time: ""
            })
        }

        player1LastUpdate = snapshot.val().player_1_last_update;
        player2LastUpdate = snapshot.val().player_2_last_update;
        player1 = snapshot.val().player_1;
        player2 = snapshot.val().player_2;


        if ((status === "begin") || (status === "nogame") || (status === "join") || ((status === "waiting") && (player2 === true))) {

            clearTimeout(connectTimeout);      //Don't show connecting message if under 2 seconds to get here

            gameStatus = getGameStatus();
            setText(gameStatus);
        }

        if ((status === "selected")) {    //get update from opponent
            if ((isPlayerOne) && (snapshot.val().player_2_pick != "") && (snapshot.val().player_2_pick_new)) {
                player2Pick = snapshot.val().player_2_pick;
                status = "result";
                clearInterval(oppPlayCountdown);
                clearTimeout(oppPlayTimeout);
                database.ref('/game').update({
                    player_2_pick_new: false
                })
                setText(status);
            } else if ((!isPlayerOne) && (snapshot.val().player_1_pick != "") && (snapshot.val().player_2_pick_new)) {
                player2Pick = snapshot.val().player_1_pick;
                status = "result";
                clearInterval(oppPlayCountdown);
                clearTimeout(oppPlayTimeout);
                database.ref('/game').update({
                    player_1_pick_new: false
                })
                setText(status);
            }
        }

        // console.log(snapshot);

        // If any errors are experienced, log them to console.
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });


    function getGameStatus() {

        var currentdate = new Date();

        var secLastUpdate1 = (Date.parse(currentdate) - Date.parse(player1LastUpdate)) / 1000;
        var secLastUpdate2 = (Date.parse(currentdate) - Date.parse(player2LastUpdate)) / 1000;

        var player1Active = false;
        var player2Active = false;

        // console.log((player1LastUpdate.toDate() - currentdate).getSeconds());
        if ((player1) && (secLastUpdate1 < 35)) {   //have player 1
            player1Active = true;
        }

        if ((player2) && (secLastUpdate2 < 35)) {   //have player 1
            player2Active = true;
        }

     

        if ((player1Active) && (player2Active) && (!isPlayerOne)) {   //game in progress, can't play
            status = "inprogress";              //nogame, join, inprogress
        } else if ((player1Active) && (!isPlayerOne)) {                 //player 1 waiting for a game
            status = "join";                    //nogame, join, inprogress
        } else if ((player2Active) && (player1Active)) {   //start the game
            status = "gamebegins";
            setText(status);
        } else {
            status = "nogame";
        }

        return (status);
    }


    function setText(headerStatus) {
        $("#msg_card_body").empty();
        var newP = $("<p>");
        newP.attr("class", "card-text");

        if (headerStatus === "join") {        //join existing game
            newP.text('Welcome to Rock, Paper, Scissor! Your opponent is waiting to play.')

            var newA = $("<a>");
            newA.attr("class", "btn btn-dark btn-lg");
            newA.attr("id", "join_btn");
            newA.text("Join a Game");
            newA.attr("href", "#");

            $("#msg_card_body").append(newP, newA);
        } else if (headerStatus === "nogame") {       //start a new game
            newP.text('Welcome to Rock, Paper, Scissor!')

            var newA = $("<a>");
            newA.attr("class", "btn btn-dark btn-lg");
            newA.attr("id", "start_btn");
            newA.text("Start a New Game");
            newA.attr("href", "#");

            $("#msg_card_body").append(newP, newA);
        } else if (headerStatus === "inprogress") {     //game in progress, so can't play
            newP.text('There is an active game.  Please try again later.')             //game in progress
            $("#msg_card_body").append(newP)
        } else if (headerStatus === "waiting") {        //waiting for an opponent

            newP.html('Waiting <span id="countdown">30</span> seconds for an opponent...');

            countdownTime = 30;
            opponentTimeout = setTimeout(function () {
                setText("opponentwaitTO");

                var currentdate = new Date();
                status = "oppenentwaitTO"
                database.ref('/game').update({
                    player_1: false,
                    player_1_last_update: currentdate,
                    player_1_pick: "",
                    start_time: currentdate
                })
            }, 30000);
            opponentCountdown = setInterval(function () {
                countdownTime--;
                $("#countdown").text(countdownTime);
            }, 1000)
            $("#msg_card_body").append(newP);
        } else if (headerStatus === "opponentwaitTO") {         //Time Out on opponenet wait
            clearTimeout(opponentTimeout);
            clearInterval(opponentCountdown);

            newP.text('No opponent joined your game.')

            var newA = $("<a>");
            newA.attr("class", "btn btn-dark btn-lg");
            newA.attr("id", "start_btn");
            newA.text("Try Again to Start a Game");
            newA.attr("href", "#");
            $("#msg_card_body").append(newP, newA);

            status = "begin";


        } else if (headerStatus === "connecting") {
            newP.html('Please wait, while I connect to the game database...');
            $("#msg_card_body").append(newP);
        } else if (headerStatus === "gamebegins") {

            clearTimeout(opponentTimeout);
            clearInterval(opponentCountdown);

            newP.html('You have <span id="countdown">30</span> seconds to choose a weapon:');

            var rockA = $("<a>");
            rockA.attr("class", "btn btn-dark btn-lg mt-1 mr-1 rps-img");
            rockA.attr("href", "#");
            rockA.attr("data-val", "Rock");

            var rockImg = $("<img>");
            rockImg.attr("class", "rps-img-size");
            rockImg.attr("src", "assets/images/rock.png");

            rockA.append(rockImg);

            var paperA = $("<a>");
            paperA.attr("class", "btn btn-dark btn-lg mt-1 mr-1 rps-img");
            paperA.attr("href", "#");
            paperA.attr("data-val", "Paper");

            var paperImg = $("<img>");
            paperImg.attr("class", "rps-img-size");
            paperImg.attr("src", "assets/images/paper.png");

            paperA.append(paperImg);

            var scissorA = $("<a>");
            scissorA.attr("class", "btn btn-dark btn-lg mt-1 mr-1 rps-img");
            scissorA.attr("href", "#");
            scissorA.attr("data-val", "Scissor");

            var scissorImg = $("<img>");
            scissorImg.attr("class", "rps-img-size");
            scissorImg.attr("src", "assets/images/scissor.png");

            scissorA.append(scissorImg);

            $("#msg_card_body").append(newP, rockA, paperA, scissorA);

            // countdownTime = 30;
            // playTimeout = setTimeout(function () {
            //     clearInterval(playCountdown);
            //     // setText("tooslow");
            //     alert("too slow?");
            //     var currentdate = new Date();
            //     status = "tooslow"

            //     // if (isPlayerOne) {    //Update database with timeout for player_1 and end game



            //     //}
            //     // database.ref('/game').update({
            //     //     player_1: false,
            //     //     player_1_last_update: currentdate,
            //     //     player_1_pick: "",
            //     //     start_time: currentdate
            //     // })
            // }, 30000);
            // playCountdown = setInterval(function () {
            //     countdownTime--;
            //     $("#countdown").text(countdownTime);
            // }, 1000)
        } else if (headerStatus === "selected") {        //you choose, now waiting for opponent
            //get time since last update for opponent
            //set timer for ending game if no update before then
            //check opponent selection variable -- if selection then move on the status="results"


            newP.html('You chose "' + player1Pick + '".  Waiting <span id="countdown">30</span> seconds for your opponent to choose a weapon...');

            $("#msg_card_body").append(newP);

            countdownTime = 30;
            // oppPlayTimeout = setTimeout(function () {
            //     clearInterval(playCountdown);
            //     // setText("tooslowopp");

            //     var currentdate = new Date();
            //     status = "tooslowopp"
            // }, 30000);
            // oppPlayCountdown = setInterval(function () {
            //     countdownTime--;
            //     $("#countdown").text(countdownTime);
            // }, 1000)

        } else if (headerStatus === "result") {  //We got a completed game!  Show the results

            clearInterval(oppPlayCountdown);
            clearTimeout(oppPlayTimeout);

            clearInterval(playCountdown);
            clearTimeout(playTimeout);
            //determine the winner
            if (player1Pick === "Rock") {
                if (player2Pick === "Paper") {
                    player1WinStatus = "lose";
                } else if (player2Pick === "Scissor") {
                    player1WinStatus = "win";
                } else {
                    player1WinStatus = "tie";
                }
            } else if (player1Pick === "Paper") {
                if (player2Pick === "Rock") {
                    player1WinStatus = "win";
                } else if (player2Pick === "Scissor") {
                    player1WinStatus = "lose";
                } else {
                    player1WinStatus = "tie";
                }
            } else {
                if (player2Pick === "Rock") {
                    player1WinStatus = "lose";
                } else if (player2Pick === "Paper") {
                    player1WinStatus = "win";
                } else {
                    player1WinStatus = "tie";
                }
            }
            // alert(player1Pick);
           
            var resultMsg = "";
            var midResult = "beats";
            var p1Img = $("<img>");
            p1Img.attr("class","rps-img-size");
            var p2Img = $("<img>");
            p2Img.attr("class","rps-img-size");

            if (player1WinStatus === "win") {
                resultMsg = "You win :)";
                p1Img.attr("src","assets/images/" + player1Pick + ".png");
                p2Img.attr("src","assets/images/" + player2Pick + ".png");
            } else if (player1WinStatus === "lose") {
                resultMsg = "You lose :(";
                p1Img.attr("src","assets/images/" + player2Pick + ".png");
                p2Img.attr("src","assets/images/" + player1Pick + ".png");
            } else {
                resultMsg = "You tie :/";
                midResult = "matches";
            }

            // alert(player1WinStatus);
            var img1Div = $("<div>");
            img1Div.attr("class","win-size");
            img1Div.append(p1Img);

            var img2Div =  $("<div>");
            img2Div.attr("class","win-size");
            img2Div.append(p2Img);

            var span1 = $("<div>");
            span1.text(midResult);
            span1.attr("class","win-size");

            var span2 = $("<div>");
            span2.text(resultMsg)
            span2.attr("class","win-size");

            newP.append(img1Div, span1, img2Div, span2);

            player1WinStatus = "";

            var newA = $("<a>");
            newA.attr("class", "btn btn-dark btn-lg mt-2");
            newA.attr("id", "play_again_btn");
            newA.text("Play Again");
            newA.attr("href", "#");

            var aDiv = $("<div>");

            var pDiv = $("<div>");
            pDiv.append(newP);
            pDiv.css("display","inline-block");

            $("#msg_card_body").append(pDiv, aDiv, newA);
            var currentdate = new Date();

            // if (isPlayerOne) {
            //     database.ref('/game').update({
            //         player_1_last_update: currentdate,
            //         player_1_pick: "",
            //         player_1_pick_new: false
            //     })
            // } else {
            //     database.ref('/game').update({
            //         player_2_last_update: currentdate,
            //         player_2_pick: "",
            //         player_2_pick_new: false
            //     })
            // }

        }
    }

});