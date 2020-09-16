/// <reference path="./jquery.d.ts" />
/// <reference path="../../build/spine-webgl.d.ts" />

/**
 * @type {HTMLCanvasElement}
 */
var $canvas = $('canvas')[0];
$canvas.width = $canvas.height = 300;
var config = {
    alpha: false
};
var gl =
    $canvas.getContext('webgl', config) ||
    $canvas.getContext('experimental-webgl', config);

// 着色器
var shader = spine.webgl.Shader.newTwoColoredTextured(gl);
// 多边形批处理
var batcher = new spine.webgl.PolygonBatcher(gl);
var mvp = new spine.webgl.Matrix4();
// ??
mvp.ortho2d(0, 0, $canvas.width - 1, $canvas.height - 1);
var skeletonRenderer = new spine.webgl.SkeletonRenderer(gl);
var assetManager = new spine.webgl.AssetManager(gl);

assetManager.loadTextureAtlas('./assets/Ubbie_1.atlas');
assetManager.loadTexture('./assets/Ubbie_1.png');
assetManager.loadText('./assets/Ubbie_1.json');

/**
 * @typedef {Object} SkeletonItem
 * @property {spine.Skeleton} skeleton
 * @property {spine.AnimationState} state
 * @property {} bounds
 */

/**
 * @type {{[key:string]: SkeletonItem}}
 */
var skeletons = {};

var activeSkeleton = 'Ubbie_1';
var lastFrameTime = Date.now();
requestAnimationFrame(load);

// 加载资源
function load() {
    if (assetManager.isLoadingComplete()) {
        skeletons['Ubbie_1'] = loadSkeleton('Ubbie_1', 'turn face');
        lastFrameTime = Date.now();
        requestAnimationFrame(render);
    } else {
        requestAnimationFrame(load);
    }
}
function loadSkeleton(name, initialAnimation, skin) {
    if (typeof skin === 'undefined') skin = 'default';
    var atlas = assetManager.get('./assets/' + name + '.atlas');
    var atlasLoader = new spine.AtlasAttachmentLoader(atlas);

    var skeletonJson = new spine.SkeletonJson(atlasLoader);
    var skeletonDataFile = assetManager.get('./assets/' + name + '.json');
    var skeletonData = skeletonJson.readSkeletonData(skeletonDataFile);
    var skeleton = new spine.Skeleton(skeletonData);

    var bounds = calculateSetupPoseBounds(skeleton);

    var animationStateData = new spine.AnimationStateData(skeleton.data);
    var animationState = new spine.AnimationState(animationStateData);
    animationState.setAnimation(0, initialAnimation, false);
    animationState.addListener({
        start: function (track) {
            console.log('Animation on track ' + track.trackIndex + ' started');
        },
        interrupt: function (track) {
            console.log(
                'Animation on track ' + track.trackIndex + ' interrupted'
            );
        },
        end: function (track) {
            console.log('Animation on track ' + track.trackIndex + ' ended');
        },
        disposed: function (track) {
            console.log('Animation on track ' + track.trackIndex + ' disposed');
        },
        complete: function (track) {
            console.log(
                'Animation on track ' + track.trackIndex + ' completed'
            );
        },
        event: function (track, event) {
            console.log(
                'Event on track ' +
                    track.trackIndex +
                    ': ' +
                    JSON.stringify(event)
            );
        }
    });

    return {
        skeleton: skeleton,
        state: animationState,
        bounds: bounds
    };
}

function calculateSetupPoseBounds(skeleton) {
    skeleton.setToSetupPose();
    skeleton.updateWorldTransform();
    var offset = new spine.Vector2();
    var size = new spine.Vector2();
    skeleton.getBounds(offset, size, []);
    return { offset: offset, size: size };
}
// 渲染
function render() {
    var delta = (Date.now() - lastFrameTime) / 10000;
    resize();
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Apply the animation state based on the delta time.
    var skeleton = skeletons[activeSkeleton].skeleton;
    var state = skeletons[activeSkeleton].state;
    state.update(delta);
    state.apply(skeleton);
    skeleton.updateWorldTransform();

    // Bind the shader and set the texture and model-view-projection matrix.
    shader.bind();
    shader.setUniformi(spine.webgl.Shader.SAMPLER, 0);
    shader.setUniform4x4f(spine.webgl.Shader.MVP_MATRIX, mvp.values);

    // Start the batch and tell the SkeletonRenderer to render the active skeleton.
    batcher.begin(shader);
    skeletonRenderer.vertexEffect = null;
    skeletonRenderer.premultipliedAlpha = true;
    skeletonRenderer.draw(batcher, skeleton);
    batcher.end();

    shader.unbind();
    requestAnimationFrame(render);
}
function resize() {
    var w = canvas.clientWidth;
    var h = canvas.clientHeight;
    if (canvas.width != w || canvas.height != h) {
        canvas.width = w;
        canvas.height = h;
    }

    // Calculations to center the skeleton in the canvas.
    var bounds = skeletons[activeSkeleton].bounds;
    var centerX = bounds.offset.x + bounds.size.x / 2;
    var centerY = bounds.offset.y + bounds.size.y / 2;
    var scaleX = bounds.size.x / canvas.width;
    var scaleY = bounds.size.y / canvas.height;
    var scale = Math.max(scaleX, scaleY) * 1.2;
    if (scale < 1) scale = 1;
    var width = canvas.width * scale;
    var height = canvas.height * scale;

    mvp.ortho2d(centerX - width / 2, centerY - height / 2, width, height);
    gl.viewport(0, 0, canvas.width, canvas.height);
}
