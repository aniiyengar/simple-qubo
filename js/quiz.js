var ipc = require('ipc');
var list = [];

var resizeElements = function() {
	$("#quiz").css("top", $(window).height()/2 - 150 + "px");
}

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
}


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
	list = l;
	game = true;
	$("#submit").text("Submit");
	$("#ans").removeAttr("disabled").focus();
	game = true;
	done = false;
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

var populate = function() {

	if (table.size() == 0) {
		game = false;
		$("#question p.q").html("Done! You got:<br/>" + numRight + "/" + (numRight+numWrong) + ", or " + Math.floor((numRight+0.0)/(numRight+numWrong)*100) + "%<br/>Refresh to go again.");
		$("#ans").val("");
	}
	else {
		currPos = Math.floor((Math.random() * table.size()));
		currQ = table.keyAt(currPos);
		currA = table.valueAt(currPos);
		$("#question p.q").text(currQ);
		$("#ans").val("");
	}

	$("#ans").focus();

}

var verify = function() {
	var str = $("#ans").val();

	if (jaroWinkler(str, currA) > 0.85) {
		// Answer is correct
		numRight++;
		$("#feedback p").text("Correct! The correct answer was " + currA);
		$("#feedback p").css({
			"color" : "green"
		});
		table.removeItem(currPos);
	}
	else {
		numWrong++;
		$("#feedback p").text("Incorrect! The correct answer was " + currA);
		$("#feedback p").css({
			"color" : "red"
		});
	}

	$("#label-question").text("Question #: " + (numWrong+numRight));
	$("#label-correct").text("Correct #: " + (0+numRight));
	$("#label-incorrect").text("Incorrect #: " + (numWrong+0));
	$("#label-percentage").text("Percentage: " + Math.floor((numRight+0.0)/(numRight+numWrong)*100) + "%");

	populate();

}

$("#submit").click(function() {
	console.log(game);
	if (!game) {
		ipc.send('note', 'get');
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
}