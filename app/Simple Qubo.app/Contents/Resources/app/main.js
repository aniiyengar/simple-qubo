var app = require('app');
var BrowserWindow = require('browser-window');
var ipc = require('electron').ipcMain;
var fs = require('fs');

//var filename = __dirname + '/notes.json';
var notesDir = __dirname + '/notes/';
var currFile = "";
var files = [];
var notes = [];

require('crash-reporter').start();

var notesWindow = null;
var quizWindow = null;

var write = function() {
	fs.writeFileSync(notesDir + currFile + '.json', JSON.stringify(notes));
}

var process = function(note) {

	if (note.answer.trim().length == 0 || note.clues.trim().length == 0) {
		return;
	}
	else {
		for (var i = 0; i < notes.length; i ++) {
			if (notes[i].answer.toLowerCase() == note.answer.toLowerCase()) {
				note.clues = notes[i].clues + '\n' + note.clues;
				note.answer = notes[i].answer;
				notes.splice(i--, 1);
			}
		}

		note.id = '' + Date.now();

		notes.unshift(note);
	}

}

var loadFile = function(fname, sender) {
	currFile = fname;
	console.log(currFile);
	var text = fs.readFileSync(notesDir + fname + '.json');
	notes = JSON.parse(text);
	sender.send('file-loaded', {
		filename: fname,
		notes: notes
	});
}

app.on('window-all-closed', function() {
	app.quit();
});

ipc.on('files', function(evt, arg) {
	fs.readdir(notesDir, function(err, f) {
		if (err) throw err;
		files = [];

		for (var k = 0; k < f.length; k++) {
			if (f[k] == '.DS_Store' || f[k] == '.gitignore') continue;
			else {
				var fn = f[k];
				files.push(fn.slice(0, -5));
			}
		}

		evt.sender.send('files-list', files);

	});
});

ipc.on('rename', function(evt, arg) {
	fs.renameSync(notesDir + currFile + '.json', notesDir + arg + '.json');
	currFile = arg;

	fs.readdir(notesDir, function(err, f) {
		if (err) throw err;
		files = [];

		for (var k = 0; k < f.length; k++) {
			if (f[k] == '.DS_Store') continue;
			else {
				var fn = f[k];
				files.push(fn.slice(0, -5));
			}
		}

		evt.sender.send('files-list', files);
		loadFile(currFile, evt.sender);

	});
});

ipc.on('file', function(evt, arg) {
	loadFile(arg.file, evt.sender);
});

ipc.on('note', function(evt, arg) {
	console.log(notes);
	if (arg.type == 'get') {
		evt.sender.send('notes-clean', notes);
	}
	else {
		process(arg);
		write();
		evt.sender.send('notes-clean', notes);
	}
});

ipc.on('remove-note', function(evt, arg) {
	for (var i =0; i < notes.length; i++) {
		if (notes[i].id == arg) {
			notes.splice(i, 1);
			break;
		}
	}
	write();
	evt.sender.send('notes-clean', notes);
});

ipc.on('remove-clue', function(evt, arg) {
	for (var i = 0; i < notes.length; i++) {
		if (notes[i].id == arg.id) {
			var a = notes[i].clues.split('\n');
			a.splice(arg.ix, 1);
			if (a.length == 0) {
				notes.splice(i, 1);
			}
			else {
				notes[i].clues = a.join('\n');
			}
			break;
		}
	}
	write();
	evt.sender.send('notes-clean', notes);
});

ipc.on('start-quiz', function(evt, arg) {
	quizWindow = new BrowserWindow({width: 1000, height: 600});
	quizWindow.loadURL('file://' + __dirname + '/views/quiz.html');
});

ipc.on('new-file', function(evt, arg) {
	currFile = 'Untitled-' + Math.floor(new Date());
	fs.writeFileSync(notesDir + currFile + '.json', '[]');

	fs.readdir(notesDir, function(err, f) {
		if (err) throw err;
		files = [];

		for (var k = 0; k < f.length; k++) {
			if (f[k] == '.DS_Store') continue;
			else {
				var fn = f[k];
				files.push(fn.slice(0, -5));
			}
		}

		evt.sender.send('files-list', files);
		loadFile(currFile, evt.sender);

	});
});

app.on('ready', function() {
	notesWindow = new BrowserWindow({width: 1000, height: 600});
	notesWindow.loadURL('file://' + __dirname + '/views/notes.html');

	notesWindow.on('closed', function() {
		notesWindow = null;
	});
});

