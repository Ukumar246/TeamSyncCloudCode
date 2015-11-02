// Deployed by karsh X
Parse.Cloud.define("test", function(request, response) {
	console.log("Parse Cloud Code Works!");
  	response.success("cool");
});


// ----------- Before Save Game ------------
Parse.Cloud.beforeSave("Game", function(request, response){
    var thisUser = Parse.User.current();
	var thisObject = request.object;

    // Save Game
    thisObject.set("inProgress",1);
    thisObject.set("createdBy", thisUser);

    // CREATE Home Score Objects
    var homeScoreObj = Parse.Object.extend("Score_basketball");
    var gameScore = new homeScoreObj();
    gameScore.set("score", 0);
    gameScore.set("quarterScore1", 0);
    gameScore.set("quarterScore2", 0);
    gameScore.set("quarterScore3", 0);
    gameScore.set("quarterScore4", 0);
    gameScore.set("homeTeam", true);

    thisObject.set("homeTeamScore", gameScore);                // Home Game Score
    
    gameScore.save(null, {
      success: function(gameScore) {
            console.log("* home game score saved");

            var awayScoreObj = Parse.Object.extend("Score_basketball");
            var awayScore = new awayScoreObj();
            awayScore.set("score", 0);
            awayScore.set("quarterScore1", 0);
            awayScore.set("quarterScore2", 0);
            awayScore.set("quarterScore3", 0);
            awayScore.set("quarterScore4", 0);
            awayScore.set("homeTeam", false);
          
            thisObject.set("awayTeamScore", awayScore);         // Away Game Score							

            awayScore.save(null, {
                success: function(awayScore) {
                     console.log("* away game score saved");
                     console.log("## GAME Save SUCCESSFUL! ##");
                    // SUCESS
                    response.success();
                },
                error: function(awayScore, error) {
                    console.error("* away game score failed to save" + error.message);
                    // FAIL
                    response.error();
                }
            });
        },
        error: function(gameScore, error) {
                    console.error("* home game score failed to save" + error.message);
                    response.error();
        }
    });	
});

// ----------- After Save Game -------------
Parse.Cloud.afterSave("Game", function(request) {

    var thisUser = Parse.User.current();
	var thisObject = request.object;

    console.log("====== AFTER SAVE GAME =========");
    
	var queryTeam = thisObject.get("awayTeamID");
	// Add to Away Team
	queryTeam.fetch({  
		success: function(awayTeam){
			awayTeam.addUnique("games", thisObject);
			awayTeam.save();
            console.log("* away team fetched and linked");

			// Add to Home Team
      		var queryHomeTeam = thisObject.get("homeTeamID");
			queryHomeTeam.fetch({
				success: function(homeTeam){
					homeTeam.addUnique("games", thisObject);
					homeTeam.save();										
                    
                    // Home Score Link
                    var queryHomeScore = thisObject.get("homeTeamScore");
                    queryHomeScore.fetch({
                        success: function(homeScore){ 
                            homeScore.set("game", thisObject);
                            console.log("* home score linked to game!");
                            
                            // Away Score Link
                            var queryAwayScore = thisObject.get("awayTeamScore");
                            queryAwayScore.fetch({
                                success: function(awayScore){ 
                                    awayScore.set("game", thisObject);
                                    console.log("* away score linked to game!");
                                    
                                    console.log("*** GAME SAVE PROCESS COMPLETE *** :Karsh is a true G");
                                },
                                error: function(awayScore, error){
                                    console.error("* query error: away score could not be fetched");        
                                }
                       
                            });
                            
                        },
                        error: function(homeScore, error){
                            console.error("* query error: home score could not be fetched");        
                        }
                       
                    });
                
                },
                error: function(homeTeam, error)
                {
                    console.error("* query error: home team could not be fetched");
                }
            });
        },
        error: function(awayTeam, error)
        {
            console.error("* query error: could not fetch away team");
        }
    });

});

/*
Parse.Cloud.afterSave("Score_basketball", function(request) {
    var thisUser = Parse.User.current();
	var thisObject = request.object;

    console.log("** After Save Score \t" + " ====== STAUTS: existed= " + thisObject.isNew()  + " ========= ");
    
    var queryGame = thisObject.get("game");
    
    queryGame.fetch({
          success: function(gameObject) {
            console.log("* game fetched");
            
            if (thisObject.get("homeTeam") == true)
            {
                console.log("* adding pointer to original game object \t field: home");
                gameObject.set("homeTeamScore", thisObject); 
                
                gameObject.save(null, {
                      success: function(gameScore) {
                        console.log("* original game object saved");
                      },
                      error: function(gameScore, error) {
                        console.error("* original game object could NOT SAVE! \t reason:" + error.message);
                      }
                });
            }
            else
            {
                console.log("* adding pointer to original game object \t field: away");
                gameObject.set("awayTeamScore", thisObject); 
                
                gameObject.save(null, {
                      success: function(gameScore) {
                        console.log("* original game object saved");
                      },
                      error: function(gameScore, error) {
                        console.error("* original game object could NOT SAVE! \t reason:" + error.message);
                      }
                });
            }
             
          },
          error: function(gameObject, error) {
            console.error("* game fetch failed \treason:" + error.message);
          }
    });
    
});

//afterDelete triggger that removes references to deleted game in the correponding teams as well as deletes the score objects connected to the game
Parse.Cloud.afterDelete("Game", function(request){
	//delete score objects
	var queryAwayScore = request.object.get("awayTeamScore");

	queryAwayScore.fetch({
		success: function(awayScore){
			awayScore.destroy({
			  success: function(myObject) {

			    	var queryHomeScore = request.object.get("homeTeamScore");

					queryHomeScore.fetch({
						success: function(homeScore){
							homeScore.destroy({
							  success: function(myObject) {

							    // The object was deleted from the Parse Cloud.

							    //delete reference to game in the team objects
								var queryTeam = request.object.get("awayTeamID");

								queryTeam.fetch({
									success: function(awayTeam){

										console.log("Success in Fetching awayTeam Object. Destroying Now.");

										awayTeam.remove("games", request.object);
										awayTeam.save();

							      		var queryTeam = request.object.get("homeTeamID");

										queryTeam.fetch({
											success: function(homeTeam){

												console.log("Success in Fetching homeTeam Object. Destroying Now.");


												homeTeam.remove("games", request.object);
												homeTeam.save();
											},
											error: function(homeTeam, error){
												console.error("Error removing game from homeTeam array! " + error.code + ": " + error.message);
											}
										});
									},
									error: function(myObject, error){
										console.error("Error removing game from awayTeam array! " + error.code + ": " + error.message);
									}

								});


							  },
							  error: function(myObject, error) {
							    // The delete failed.
							    // error is a Parse.Error with an error code and message.
							    console.error("Error deleting homeTeamScore " + error.code + ": " + error.message);
							  }
							});
						}

					});
			  },
			error: function(myObject, error) {
			    // The delete failed.
			    // error is a Parse.Error with an error code and message.
          		console.error("Error deleting awayTeamScore " + error.code + ": " + error.message);
			  }
			});
		}

	});

});

*/

/*
Parse.Cloud.define("teams", function(request, response) {
	console.log("teams test function");  

	var team = Parse.Object.extend("Team");
	var query = new Parse.Query(team);
	query.find({
	  success: function(results) {
	    var statusStr = "Successfully retrieved " + results.length + " teams.";
	    console.log(statusStr);
		
		// Iterate over all team id's
	    for (var i = 0; i < results.length; i++) 
	    {
	      var object = results[i];
	      var displayStr = object.id + "\tname: " + object.get("teamName");
	      console.log(displayStr);
	    }

	    response.success(results);
	  },
	  error: function(error) {
	    var displayStr = "Error: " + error.code + " " + error.message;
	    console.log(displayStr);
	  	
	    response.success("failed");
	  }
	});
});
*/

Parse.Cloud.define("sendPushToUser", function(request, response) {
  var senderUser = request.user;
  var channel = request.params.channel;
  var message = request.params.message;

/* Potential For Fututre Implementation. */

  // // Validate that the sender is allowed to send to the recipient.
  // // For example each user has an array of objectIds of friends
  // if (senderUser.get("friendIds").indexOf(recipientUserId) === -1) {
  //   response.error("The recipient is not the sender's friend, cannot send push.");
  // }

  // // Validate the message text.
  // // For example make sure it is under 140 characters
  // if (message.length > 140) {
  // // Truncate and add a ...
  //   message = message.substring(0, 137) + "...";
  // }

  Parse.Push.send({
	  	channels: [channel],
	 	 data: {
	 	   alert: message
	 	 }
	  },
	 {
	  success: function() {
	      response.success("Push was sent successfully.")
	  },
	  error: function(error) {
	      response.error("Push failed to send with error: " + error.message);
	 }
  });
  
});
