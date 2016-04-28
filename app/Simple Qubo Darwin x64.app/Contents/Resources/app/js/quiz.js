var ipc = require('ipc');
var list = [];
var files = [];
var selectedFiles = [];

var resizeElements = function() {
	$("#quiz-container").css("top", $(window).height()/2 - $("#quiz-container").height()/2 + "px");
};

var game = false, done, currQ, currA, numRight, numWrong, currPos, table;

var AssocTable = function(keyvals) {
	this.vals = keyvals;

	this.keyValueStore = function() {
		var r = {};
		for (var i = 0; i < this.vals.length; i+=2) {
			r[this.vals[i]] = this.vals[i+1];
		}
		return r;
	};
	this.removeItem = function(pos) {
		this.vals.splice(pos*2, 2);
	};
	this.keyAt = function(pos) {
		return this.vals[pos*2];
	};
	this.valueAt = function(pos) {
		return this.vals[pos*2+1];
	};
	this.valueForKey = function(key) {
		return this.keyValueStore()[key];
	};
	this.size = function() {
		return Object.keys(this.keyValueStore()).length;
	}
};


ipc.on('notes-clean', function(arg) {
	var l = [];
	for (var i = 0; i < arg.length; i++) {
		var note = arg[i];
		var clues = note.clues.split('\n');
		for (var j = 0; j < clues.length; j++) {
			l.push(clues[j]);
			l.push(note.answer);
		}
	}
	console.log(l.length);
	list = l;
	game = true;
	$("#submit").text("Submit");
	$("#ans").removeAttr("disabled").focus();
	currQ = "";
	currA = "";
	numRight = 0;
	numWrong = 0;
	currPos = 0;
	table = new AssocTable(list);
	populate();
});

$(window).resize(resizeElements);
resizeElements();

ipc.send('files');

ipc.on('files-list', function(arg) {
	files = arg;

	$("#notes-options").html('<p class="bold">Choose from notes:</p>');
	for (var i = 0; i < files.length; i++) {
		var eDiv = $("<div class='note-choice'></div>");
		var eCheck = $("<input class='note-choice-box' type='checkbox' id='check-" + files[i] + "' name='" + files[i] + "' />");
		var eLabel = $("<label for='check-" + files[i] + "'>" + files[i] + "</label>");
		eDiv.append(eCheck).append(eLabel);
		$("#notes-options").append(eDiv);
	}

	$(".note-choice-box").change(function() {
		if ($(this)[0].checked == true) {
			selectedFiles.push($(this).attr('name'));
		}
		else {
			selectedFiles.splice(selectedFiles.indexOf($(this).attr('name')), 1);
		}
		console.log(selectedFiles);
	});
});

var populate = function() {

	if (table.size() == 0) {
		game = false;
		var total = numRight + numWrong;
		var percentage = Math.floor((numRight+0.0)/(numRight+numWrong)*100);
		$("#question p.q").html("Done! You got:<br/>" + numRight + "/" + total
			+ ", or " + percentage + "%<br/>Click <b>Start</b> to go again.");
		$("#ans").val("").attr("disabled", "disabled");
		$("#submit").text("Start");
		$("#label-question").text("Question #: ");
		$("#label-correct").text("Correct #: ");
		$("#label-incorrect").text("Incorrect #: ");
		$("#label-percentage").text("Percentage: ");
	}
	else {
		currPos = Math.floor((Math.random() * table.size()));
		currQ = table.keyAt(currPos);
		currA = table.valueAt(currPos);
		$("#question p.q").text(currQ);
		$("#ans").val("");
	}

	$("#ans").focus();

};

var verify = function() {
	var str = $("#ans").val();
	var answers = currA.split(";");

	var correct = false;
	for (var i = 0; i < answers.length; i++) {
		answers[i] = $.trim(answers[i]);
		if (jaroWinkler(str, answers[i]) > 0.85) {
			correct = true;
			numRight++;
			$("#feedback p").text("Correct! The correct answer was " + currA);
			$("#feedback p").css({
				"color" : "green"
			});
			table.removeItem(currPos);
			break;
		}
	}

	if (!correct) {
		numWrong++;
		$("#feedback p").text("Incorrect! The correct answer was " + currA);
		$("#feedback p").css({
			"color" : "red"
		});
	}

	var percentage = Math.floor((numRight+0.0)/(numRight+numWrong)*100);

	$("#label-question").text("Question #: " + (numWrong+numRight));
	$("#label-correct").text("Correct #: " + (0+numRight));
	$("#label-incorrect").text("Incorrect #: " + (numWrong+0));
	$("#label-percentage").text("Percentage: " + percentage + "%");

	populate();

};

$("#submit").click(function() {
	console.log(game);
	if (!game) {
		ipc.send('note-combined', {type:'get', files:selectedFiles});
	}
	else {
		verify();
	}

});

document.onkeydown = function(evt) {
	if ($(":focus").attr("id") == "ans" && evt.keyCode == 13) {
		console.log(game);
		verify();
	}
};

