$(document).ready(function () {

    var connectTimeout = setTimeout(function () {
        setText("connecting");
    }, 2000);
    //  setText("connecting");     //connecting to database



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
    var comp = {
        name: "",
        id: "",
        master: true
    }
    var playerOneName = "Lev";
    var opponentTimeout;
    var opponentCountdown;
    var countdownTime;
    var playerName = "";
    var gameStatus = "";


    $(document).on("click", "#start_btn", function () {
        var currentdate = new Date();

        database.ref('game').update({
            player_1: true,
            player_1_last_update: currentdate,
            player_1_pick: "",
            start_time: currentdate
        })
        status = "waiting"
        setText(status);
    })

    database.ref("game").on("value", function (snapshot) {

        if (status === "begin") {
            clearInterval(connectTimeout);

            var currentdate = new Date();

            //check to see if there are two players and both players have had an action in the last 30 seconds:
            var player1LastUpdate = snapshot.val().player_1_last_update;
            var player2LastUpdate = snapshot.val().player_2_last_update;
            var player1 = snapshot.val().player_1;
            var player2 = snapshot.val().player_2;


            var secLastUpdate1 = (Date.parse(currentdate) - Date.parse(player1LastUpdate)) / 1000;
            var secLastUpdate2 = (Date.parse(currentdate) - Date.parse(player2LastUpdate)) / 1000;

            var player1Active = false;
            var player2Active = false;

            // console.log((player1LastUpdate.toDate() - currentdate).getSeconds());
            if ((player1) && (secLastUpdate1 < 35)) {  //have player 1
                player1Active = true;
            }

            if ((player2) && (secLastUpdate2 < 35)) {  //have player 1
                player2Active = true;
            }

            if ((player1Active) && (player2Active)) {  //game in progress, can't play
                gameStatus = "inprogress";      //nogame, join, inprogress
                setText(gameStatus);
            } else if (player1Active) {     //player 1 waiting for a game
                gameStatus = "join";      //nogame, join, inprogress
                setText(gameStatus);
            } else {        //we can start a game
                //check to see game status
                gameStatus = "nogame";      //nogame, join, inprogress
                setText(gameStatus);
            }
        }

        // console.log(snapshot);

    })





    function setText(headerStatus) {
        $("#msg_card_body").empty();
        var newP = $("<p>");
        newP.attr("class", "card-text");

        if (headerStatus === "join") {        //join existing game
            newP.text('<Welcome to Rock, Paper, Scissor! Your opponenet is waiting to play.')

            var newA = $("<a>");
            newA.attr("class", "btn btn-success btn-lg");
            newA.attr("id", "join_btn");
            newA.text("Join a Game");
            newA.attr("href", "#");

            $("#msg_card_body").append(newP, newA);
        } else if (headerStatus === "nogame") {       //start a new game
            newP.text('Welcome to Rock, Paper, Scissor!')

            var newA = $("<a>");
            newA.attr("class", "btn btn-success btn-lg");
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
            }, 30000);
            opponentCountdown = setInterval(function () {
                countdownTime--;
                $("#countdown").text(countdownTime);
            }, 1000)
            $("#msg_card_body").append(newP);
        } else if (headerStatus === "opponentwaitTO") {         //Time Out on opponenet wait
            clearInterval(opponentTimeout);
            clearInterval(opponentCountdown);

            newP.text('No opponent joined your game.')

            var newA = $("<a>");
            newA.attr("class", "btn btn-success btn-lg");
            newA.attr("id", "start_btn");
            newA.text("Try Again to Start a Game");
            newA.attr("href", "#");
            $("#msg_card_body").append(newP, newA);

            status = "begin";


        } else if (headerStatus === "connecting") {
            newP.html('Please wait, while I connect to the game database...');
            $("#msg_card_body").append(newP);
        }
    }

    // //get current game status
    // // Firebase watcher + initial loader HINT: .on("value")
    // database.ref().on("value", function (snapshot) {
    //     // console.log(snapshot.val());

    //     var player_1_id = snapshot.val().game.player_1_id3;

    //         console.log(player_1_id)

    //         // database.ref('game').set({
    //         //     player_1_id: 6,
    //         //     player_2_id: 0
    //         //  });


    // }, function (errorObject) {

    //     console.log("The read failed: " + errorObject.code);
    // });


    //         //  });

    // $(document).on("click", "#enter_name_btn", function () {

    //     if ($("#playername").trim() = "") {     //invalid name


    //     } else {


    //     }

    // })



});