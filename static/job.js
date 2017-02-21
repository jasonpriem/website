	var job = {
		apibaseurl: 'https://api.cottagelabs.com',
		file: undefined,
		filename: '',
		results: [],
		done: false,
		poll: undefined,
		hash: undefined,
    max:3000
	};
	if (window.location.host.indexOf('test.cottagelabs.com') !== -1) job.apibaseurl = 'https://dev.api.cottagelabs.com';
	if (window.location.host.indexOf('dev.openaccessbutton.org') !== -1) job.apibaseurl = 'https://dev.api.cottagelabs.com';

  job.review = function() {
		if ( $('#filereview').length ) {
			var msg = '<p style="color:black;">Thank you. Your file appears to have ';
			msg += job.results.length;
			msg += ' record rows.<br>';
			msg += 'Please submit for processing now:</p>';
			$('#filereview').html(msg).show();
		}
  }
  
	job.transform = function(split,wrap) {
		job.results = [];
		if (split === undefined) split = ',';
		if (wrap === undefined) wrap = '"';
		var wrapreplace = new RegExp(wrap,"g");
		// could try to look for split and wrap chars in file somehow - looking at first char is no good because systems/people sometimes only use the wraps 
		// when they must, like when surrounding content with a comma, but do not bother at other times
		
    job.file = job.file.replace(/\r\n/g,'\n').replace(/\n{2,}/g,'\n').replace(/\n*$/g,'');
		
		var lines = [];
		var fls = job.file.split('\n');
		var il = '';
		for ( var f in fls ) {
			il += fls[f];
			if ( il.split(wrap).length % 2 !== 0 ) {
				lines.push(il);
				il = '';
			}
		}
		if (lines.length > job.max) {
			$('#errormsg').html('<p style="color:black;">Sorry, the maximum amount of rows you can submit in one file is ' + job.max + '. Please reduce the size of your file and try again.</p>').show();
			job.file = undefined;
			job.filename = '';
		} else {
			var headers = [];
			var hline = lines.shift();
			var hlines = hline.split(split);
			var hl = '';
			for ( var h in hlines ) {
				if (hl.length > 0) hl += ',';
				hl += hlines[h];
				if ( hl.split(wrap).length % 2 !== 0 ) {
					hl = hl.replace(wrapreplace,'').replace(/(^\s*)|(\s*$)/g,''); // strip whitespace leading and ending header names
					//hl = hl.toLowerCase().replace(/ /g,'_').replace(/[^a-z0-9_]/g,'');; // could do additional header cleaning here
					headers.push(hl);
					hl = '';
				}
			}

			for (var i = 0; i < lines.length; i++) {
				var obj = {};
				var currentline = lines[i].split(split);
				var cl = '';
				var counter = 0;
				var lengths = 0;
				for ( var col in currentline ) {
					if (cl.length > 0) cl += ',';
					cl += currentline[col];
					if ( cl.split(wrap).length % 2 !== 0 ) {
						cl = cl.replace(wrapreplace,'');
						if (headers[counter] && headers[counter].length > 0) obj[headers[counter]] = cl;
						if (lengths === 0) lengths = cl.length;
						cl = '';
						counter += 1;
					}
				}
				if (lengths) job.results.push(obj);
			}
			job.review();
		}
  }
	
  job.prep = function(e) {
		var f;
		if( window.FormData === undefined ) {
			f = (e.files || e.dataTransfer.files);
		} else {
			f = e.target.files[0];
		}
		job.filename = f.name;
		var reader = new FileReader();
		reader.onload = (function(theFile) {
			return function(e) {
				job.file = e.target.result;
				job.transform();
			};
		})(f);
		reader.readAsBinaryString(f);
  }

	job.error = function(data) {
		$('#filesubmit').attr('value','Submit');
		$('#filereview').html('<p style="color:black;">Sorry, there has been an error with your submission. Please try again.<br>If you continue to receive an error, please contact us@cottagelabs.com attaching a copy of your file and with the following error information:<br>' + JSON.stringify(data) + '</p>').show();
  }

	job.polling = function(data) {
		$('.uploader').hide();
		$('#pollinfo').show();
		var progress = !data.data || !data.data.progress ? 0 : data.data.progress;
		var pc = (Math.floor(progress * 10))/10;
		var status = '<p>Job ';
		status += data.data && data.data.name ? data.data.name : '#' + data.data._id;
		status += '</p>';
		if (data.data && data.data.new === true) status += '<p>Your job is new, and is still being loaded into the system. For large jobs this may take a couple of minutes.</p>';
		status += '<p>Your job is ' + pc + '% complete.</p>';
		status += '<p><a id="downloadresults" href="' + job.apibaseurl + '/service/job/' + job.hash + '/results?format=csv&apikey=' + clogin.apikey + '" class="btn btn-default btn-block">Download your results</a></p>';
		if (data.data.progress !== 100) setTimeout(job.poll,10000);
		$('#pollinfo').html(status);
	}
	
	job.poll = function(hash) {
		if (hash === undefined) {
			job.hash = window.location.hash.replace('#','');
			hash = job.hash
		}
		if ( hash ) {
			$.ajax({
				url: job.apibaseurl + '/service/job/' + hash + '/progress?apikey='+clogin.apikey,
				method: 'GET',
				success: job.polling,
				error: job.error
			});		
		}
	}
		
  job.success = function(data) {
		$('.uploader').hide();
		try {
			window.history.pushState("", "poll", '#' + data.data.job);
		} catch (err) {}
		job.hash = data.data.job;
		job.poll(data.data.job);
  }
  
	job.submit = function(e) {
		$('#filereview').html("").hide();
		e.preventDefault();
		if ( !job.filename ) {
			$('#filereview').html('<p style="color:black;">You must upload a file in order to submit. Please provide more information and try again.</p>').show();
		} else {
			$('#filesubmit').attr('value','Submitting...');
			var payload = {list:job.results,name:job.filename};
			$.ajax({
				url: job.apibaseurl + '/service/job?apikey='+clogin.apikey,
				method: 'POST',
				data: JSON.stringify(payload),
				dataType: 'JSON', // TODO sort issue here, the POST invalidates preflight without jsonp but with jsonp we don't get back a jsonp object
				contentType: "application/json; charset=utf-8",
				success: job.success,
				error: job.error
			});
		}
  }
	  
	job.startup = function() {
	  $('#fileupload').on('change', job.prep);
	  $('#filesubmit').bind('click',job.submit);
		if (window.location.hash && window.location.hash.replace('#','').length === 17) { // our job IDs are 17 digits long
			setTimeout(function() {$('.uploader').hide();},200);
			$('#pollinfo').html('<p>One moment please, retrieving job status...</p>');
			job.hash = window.location.hash.replace('#','');
			job.poll(job.hash);
		}
	}