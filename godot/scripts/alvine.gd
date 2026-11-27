extends CharacterBody2D

const SPEED := 125.0
const JUMP_VELOCITY := -285.0
const GRAVITY := 850.0
const CAT_SHEET := preload("res://assets/alvine.svg")

var facing := 1.0
var animated_cat: AnimatedSprite2D

func _ready() -> void:
	_create_cat_animation()

func _physics_process(delta: float) -> void:
	var direction := Input.get_axis("ui_left", "ui_right")
	if Input.is_key_pressed(KEY_A):
		direction = -1.0
	elif Input.is_key_pressed(KEY_D):
		direction = 1.0

	if direction != 0.0:
		facing = sign(direction)
		velocity.x = direction * SPEED
	else:
		velocity.x = move_toward(velocity.x, 0.0, SPEED * 7.0 * delta)

	if not is_on_floor():
		velocity.y += GRAVITY * delta
	elif Input.is_key_pressed(KEY_SPACE) or Input.is_key_pressed(KEY_UP) or Input.is_key_pressed(KEY_W):
		velocity.y = JUMP_VELOCITY

	move_and_slide()
	_update_cat_animation()

func _create_cat_animation() -> void:
	var frames := SpriteFrames.new()
	frames.add_animation("walk")
	frames.set_animation_speed("walk", 9.0)
	frames.set_animation_loop("walk", true)
	frames.add_animation("idle")
	frames.set_animation_speed("idle", 1.0)
	frames.set_animation_loop("idle", true)

	for i in range(4):
		var atlas := AtlasTexture.new()
		atlas.atlas = CAT_SHEET
		atlas.region = Rect2(i * 96, 0, 96, 64)
		frames.add_frame("walk", atlas)

	var still := AtlasTexture.new()
	still.atlas = CAT_SHEET
	still.region = Rect2(0, 0, 96, 64)
	frames.add_frame("idle", still)

	animated_cat = AnimatedSprite2D.new()
	animated_cat.name = "AlvineSprite"
	animated_cat.sprite_frames = frames
	animated_cat.animation = "idle"
	animated_cat.position = Vector2(0, -21)
	animated_cat.scale = Vector2(0.65, 0.65)
	add_child(animated_cat)

func _update_cat_animation() -> void:
	animated_cat.flip_h = facing < 0.0
	if absf(velocity.x) > 8.0 and is_on_floor():
		if animated_cat.animation != "walk":
			animated_cat.play("walk")
	else:
		if animated_cat.animation != "idle":
			animated_cat.play("idle")
