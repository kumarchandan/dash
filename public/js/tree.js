// Load Data and Execute
(function() {
	d3.json('../public/files/tree.json', function(err, data) {
		if(err) {
			console.warn(err);
		}

		// store data for reuse
		visualize.data = data;

		// by default show first PO Order Structure
		visualize.render(data[0]);


		// Event handlers
		$('#next').on('click', function() {
			visualize.next();
		});

		$('#prev').on('click', function() {
			visualize.prev();
		});

		// On Search
		$('#doc').on('keyup', function(e) {
			if(e.keyCode === 13) {
				var val = e.target.value;
				var flag = false;
				for(var i = 0; i < visualize.data.length; i++) {
					if(val === visualize.data[i].name) {
						flag = true;
						visualize.render(visualize.data[i]);
					}
				}
				if(!flag) {
					visualize.check(-1);		// tweak to use chcek method
				}

			}
		});


	});
})();


// Generate the tree diagram
var visualize = {
	data: [],
	curr: 0,

	next: function() {
		var curr = this.curr;
		if(this.check(++curr)) {
			this.curr++;
			this.render(this.data[this.curr]);
		}
	},

	prev: function() {
		var curr = this.curr;
		if(this.check(--curr)) {
			this.curr--;
			this.render(this.data[this.curr]);
		}
	},

	check: function(pointer) {
		if(this.data === null || pointer === this.data.length || pointer < 0) {
			var elem = $('#msgs');
			elem.html('');
			elem.append(this.messages[0].noData);
			return false;
		} else {
			return true;
		}
	},

	render: function (treeData) {

		// update label
		$('#doc').val(treeData.name);
		$('.visuals').html('');

		// Build Layout
		var margin = {
			top: 20,
			right: 120,
			bottom: 20,
			left: 120
		};

		var	width = 960 - margin.right - margin.left,	// 720
			height = 500 - margin.top - margin.bottom;	// 460

		var i = 0,
			duration = 750,
			root;

		var tree = d3.layout.tree()
			.size([height, width]);

		var diagonal = d3.svg.diagonal()
			.projection(function(d) {
				return [d.y, d.x];
			});

		var svg = d3.select('.visuals').append('svg')
			.attr('width', width + margin.right + margin.left)
			.attr('height', height + margin.top + margin.bottom)
			.append('g')
			.attr('transform', 'translate('+ margin.left + ',' + margin.top + ')');

		root = treeData;
		root.x0 = height / 2;
		root.y0 = 0;

		update(root);

		d3.select(self.frameElement).style('height', '500px');

		function update(source) {

			// Compute the new tree layout.
			var nodes = tree.nodes(root).reverse(),
				links = tree.links(nodes);

			// Normalize for fixed-depth
			nodes.forEach(function(d) {
				d.y = d.depth * 180;
			});

			// update the nodes
			var node = svg.selectAll('g.node')
				.data(nodes, function(d) {
					return d.id || (d.id = ++i);
				});

			// Define the div for the tooltip
			var div = d3.select('body')
				.append('div')
				.attr('class', 'tooltip')
				.style('opacity', 0);

			// Enter any new nodes at the parent's previous position.
			var nodeEnter = node.enter().append('g')
				.attr('class', 'node')
				.attr('transform', function(d) {
					return 'translate('+ source.y0 + ',' + source.x0 +')';
				})
				.on('click', click);

			nodeEnter.append('circle')
				.attr('r', 1e-6)
				.style('fill', function(d) {
					return d._children ? 'lightsteelblue' : '#fff';
				})
				.on('mouseover', function(d) {
					div.transition()
						.duration(200)
						.style('opacity', 0.9);
					div.html(d.description)
						.style('left', (d3.event.pageX) + 'px')
						.style('top', (d3.event.pageY - 28) + 'px');
				})
				.on('mouseout', function(d) {
					div.transition()
						.duration(500)
						.style('opacity', 0);
				});

			nodeEnter.append('text')
				.attr('x', function(d) {
					return d.children || d._children ? -13 : 13;
				})
				.attr('dy', '.35em')
				.attr('text-anchor', function(d) {
					return d.children || d._children ? 'end' : 'start';
				})
				.text(function(d) {
					return d.name;
				})
				.style('fill-opacity', 1e-6);


			// Transition nodes to their new position
			var nodeUpdate = node.transition()
				.duration(duration)
				.attr('transform', function(d) {
					return 'translate('+ d.y + ',' +  d.x +')';
				});

			nodeUpdate.select('circle')
				.attr('r', 10)
				.style('fill', function(d) {
					return d._children ? 'lightsteelblue' : '#fff';
				});

			nodeUpdate.select('text')
				.style('fill-opacity', 1);

			// Transition exiting nodes to their parent's new position
			var nodeExit = node.exit().transition()
				.duration(duration)
				.attr('transform', function(d) {
					return 'translate('+ source.y + ',' + source.x +')';
				}).remove();

			nodeExit.select('circle')
				.attr('r', 1e-6);

			nodeExit.select('text')
				.style('fill-opacity', 1e-6);

			// Updates the links
			var link = svg.selectAll('path.link')
				.data(links, function(d) {
					return d.target.id;
				});

			// Enter any new links at the parent's previous position
			link.enter().insert('path', 'g')
				.attr('class', 'link')
				.attr('d', function(d) {
					var o = {
						x: source.x0,
						y: source.y0 
					};
					return diagonal({
						source: o,
						target: o
					});
				});

			// Transition links to their new positions
			link.transition()
				.duration(duration)
				.attr('d', diagonal);

			// Transition exiting nodes to the parent's new position
			link.exit().transition()
				.duration(duration)
				.attr('d', function(d) {
					var o = {
						x: source.x,
						y: source.y
					};
					return diagonal({
						source: o,
						target: o
					});
				}).remove();


			// Stash the old positions for transition.
			nodes.forEach(function(d) {
				d.x0 = d.x;
				d.y0 = d.y;
			});
		}

		// Toggle children on click
		function click(d) {
			if(d.children) {
				d._children = d.children;
				d.children = null;
			} else {
				d.children = d._children;
				d._children = null;
			}
			update(d);
		}
	},
	messages: [
		{
			noData: '<div class="alert alert-dismissible alert-warning">' +
  					'<button type="button" class="close" data-dismiss="alert">×</button>' +
  					'<h4>Oops, No Data Anymore!</h4>' +
					'<p>There\'s no data available in the system.</p></div>'
		}
	]
};