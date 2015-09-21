define(function(require) {

    'use strict';

    var pathTool = require('zrender/tool/path');
    var matrix = require('zrender/core/matrix');
    var round = Math.round;
    var Path = require('zrender/graphic/Path');
    var colorTool = require('zrender/tool/color');

    var graphic = {

        Group: require('zrender/container/Group'),

        Image: require('zrender/graphic/Image'),

        Text: require('zrender/graphic/Text'),

        Circle: require('zrender/graphic/shape/Circle'),

        Sector: require('zrender/graphic/shape/Sector'),

        Polygon: require('zrender/graphic/shape/Polygon'),

        Polyline: require('zrender/graphic/shape/Polyline'),

        Rect: require('zrender/graphic/shape/Rectangle'),

        Line: require('zrender/graphic/shape/Line'),

        Arc: require('zrender/graphic/shape/Arc'),

        /**
         * Extend shape with parameters
         */
        extendShape: function (opts) {
            return Path.extend(opts);
        },

        /**
         * Extend path
         */
        extendPath: function (pathData, opts) {
            return pathTool.extendFromString(pathData, opts);
        },

        /**
         * Create a path element from path data string
         */
        makePath: function (pathData, opts, rect) {
            var path = pathTool.createFromString(pathData, opts);
            if (rect) {
                this.resizePath(path, rect);
            }
            return path;
        },

        mergePath: pathTool.mergePath,

        /**
         * Resize a path to fit the rect
         * @param {module:zrender/graphic/Path} path
         * @param {Object} rect
         */
        resizePath: function (path, rect) {
            if (! path.applyTransform) {
                return;
            }

            var pathRect = path.getBoundingRect();

            var sx = rect.width / pathRect.width;
            var sy = rect.height / pathRect.height;

            var m = matrix.create();
            matrix.translate(m, m, [rect.x, rect.y]);
            matrix.scale(m, m, [sx, sy]);
            matrix.translate(m, m, [-pathRect.x, -pathRect.y]);
            path.applyTransform(m);
        },

        /**
         * Sub pixel optimize line for canvas
         *
         * @param {Object} param
         * @param {Object} [param.shape]
         * @param {number} [param.shape.x1]
         * @param {number} [param.shape.y1]
         * @param {number} [param.shape.x2]
         * @param {number} [param.shape.y2]
         * @param {Object} [param.style]
         * @param {number} [param.style.lineWidth]
         * @return {Object} Modified param
         */
        subPixelOptimizeLine: function (param) {
            var subPixelOptimize = graphic.subPixelOptimize;
            var shape = param.shape;
            var lineWidth = param.style.lineWidth;

            if (round(shape.x1 * 2) === round(shape.x2 * 2)) {
                shape.x1 = shape.x2 = subPixelOptimize(shape.x1, lineWidth, true);
            }
            if (round(shape.y1 * 2) === round(shape.y2 * 2)) {
                shape.y1 = shape.y2 = subPixelOptimize(shape.y1, lineWidth, true);
            }
            return param;
        },

        /**
         * Sub pixel optimize rect for canvas
         *
         * @param {Object} param
         * @param {Object} [param.shape]
         * @param {number} [param.shape.x]
         * @param {number} [param.shape.y]
         * @param {number} [param.shape.width]
         * @param {number} [param.shape.height]
         * @param {Object} [param.style]
         * @param {number} [param.style.lineWidth]
         * @return {Object} Modified param
         */
        subPixelOptimizeRect: function (param) {
            var subPixelOptimize = graphic.subPixelOptimize;
            var shape = param.shape;
            var lineWidth = param.style.lineWidth;
            var originX = shape.x;
            var originY = shape.y;
            var originWidth = shape.width;
            var originHeight = shape.height;
            shape.x = subPixelOptimize(shape.x, lineWidth, true);
            shape.y = subPixelOptimize(shape.y, lineWidth, true);
            shape.width = Math.max(
                subPixelOptimize(originX + originWidth, lineWidth, false) - shape.x,
                originWidth === 0 ? 0 : 1
            );
            shape.height = Math.max(
                subPixelOptimize(originY + originHeight, lineWidth, false) - shape.y,
                originHeight === 0 ? 0 : 1
            );
            return param;
        },

        /**
         * Sub pixel optimize for canvas
         *
         * @param {number} position Coordinate, such as x, y
         * @param {number} lineWidth Should be nonnegative integer.
         * @param {boolean=} positiveOrNegative Default false (negative).
         * @return {number} Optimized position.
         */
        subPixelOptimize: function (position, lineWidth, positiveOrNegative) {
            // Assure that (position + lineWidth / 2) is near integer edge,
            // otherwise line will be fuzzy in canvas.
            var doubledPosition = round(position * 2);
            return (doubledPosition + round(lineWidth)) % 2 === 0
                ? doubledPosition / 2
                : (doubledPosition + (positiveOrNegative ? 1 : -1)) / 2;
        },

        setHoverStyle: function (el, hoverStyle) {
            var stroke = el.style.stroke;
            var fill = el.style.fill;
            hoverStyle = hoverStyle || {};
            hoverStyle.fill = hoverStyle.fill || colorTool.lift(fill, -0.2);
            hoverStyle.stroke = hoverStyle.stroke || colorTool.lift(stroke, -0.2);

            var normalStyle = {};
            for (var name in hoverStyle) {
                normalStyle[name] = el.style[name];
            }
            el.on('mouseover', function () {
                this.style.set(hoverStyle);
                this.dirty();
            }).on('mouseout', function () {
                this.style.set(normalStyle);
                this.dirty();
            });
        }
    };

    return graphic;
});