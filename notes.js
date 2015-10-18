var ipc = require('ipc');
var notes = [];

ipc.send('note', 'get');

var w = $("#sidebar").width() + 2 * 30;

var resizeElements = function() {
	$("#main-container").width($(window).width() - 400);
	$("#main").height($(window).height() - ($("#search-bar").height() + 40));
	$(".note-right").width($("#main").width() - 248);
}

var load = function() {
	$("#main").html("");
	for (var i = 0; i < notes.length; i++) {
		var element = $("<div class='note'></div>").attr('data-id', notes[i].id);
		$(element).append($("<div class='note-left'></div>").text(notes[i].answer).append($("<div class='x'></div>")));
		var clues = notes[i].clues.split('\n');
		var noteRight = $("<div class='note-right'></div>");
		var noteList = $("<ul class='note-list'></ul>").attr('data-id', notes[i].id);
		for (var j = 0; j < clues.length; j++) {
			$(noteList).append($("<li></li>").append(clues[j]).append($("<div class='x'></div>")));
		}
		$(noteRight).append($(noteList));
		$(element).append($(noteRight));
		$("#main").append($(element));
	}

	$(".note-left").hover(function() {
		$(this).children(".x").fadeTo(0, 1);
	}, function() {
		$(this).children(".x").fadeTo(0, 0);
	});

	$(".note-list li").hover(function() {
		$(this).children(".x").fadeTo(0, 1);
	}, function() {
		$(this).children(".x").fadeTo(0, 0);
	});

	$(".x").click(function() {
		if ($(this).parent().hasClass("note-left")) {
			// remove whole note
			var id = $(this).parent().parent().data("id");
			ipc.send('remove-note', id);
		}
		else {
			// remove single clue
			var id = $(this).parent().parent().data("id");
			var ix = $(this).parent().index();
			ipc.send('remove-clue', {id: id, ix: ix});
		}
	});

	$(".note-left").dblclick(function() {
		$("#answer").val($(this).text());
		$("#clues").focus();
		console.log("FSDF");
	});

	resizeElements();
}

$(window).resize(resizeElements);
resizeElements();

var submit = function() {
	var answer = $.trim($("#answer").val());
	var clues = $.trim($("#clues").val());
	$("#answer, #clues").val("");
	ipc.send('note', {
		answer: answer,
		clues: clues
	});
};

$("#submit").click(submit);

ipc.on('notes-clean', function(arg) {
	notes = arg;
	load();
});

$("#search-box").keyup(function() {
	var list = $(".note");
	if ($(this).val().trim().length > 2) {
		for (var i = 0; i < list.length; i++) {
			var el = $(list[i]);
			var t = $(el).children(".note-left").text();
			var clues = $(el).children('.note-right').children(".note-list").children("li");
			console.log(clues);
			for (var j = 0; j < clues.length; j++) {
				t = t + " " + $(clues[j]).text();
			}
			t = t.toLowerCase();
			var term = $(this).val().trim().toLowerCase();
			console.log(t);
			if (t.indexOf(term) > -1) {
				$(el).show();
			}
			else {
				$(el).hide();
			}
		}
	}
	else {
		$(".note").show();
	}
});

$("#quiz-button").click(function() {
	ipc.send('quiz');
});

document.onkeydown = function(evt) {
	if (!evt) evt = event;
	if (evt.shiftKey && evt.keyCode == 13) {
		submit();
		$("#answer").focus();
		evt.preventDefault();
	} 
	if (evt.keyCode == 13) {
		if ($(":focus").attr("id") == "answer" && $("#answer").val().trim().length != 0) {
			$("#clues").focus();
			evt.preventDefault();
		}
		else if ($(":focus").attr("id") == "search-box" && $("#search-box").val().trim().length > 2) {
			$("#search-box").trigger('enter');
		}
	}

}



