extends CharacterBody2D

const SPEED := 125.0
const JUMP_VELOCITY := -285.0
const GRAVITY := 850.0

var facing := 1.0
var walk_time := 0.0
var was_on_floor := false

func _physics_process(delta: float) -> void:
	var direction := Input.get_axis("ui_left", "ui_right")
	if Input.is_key_pressed(KEY_A):
		direction = -1.0
	elif Input.is_key_pressed(KEY_D):
		direction = 1.0

	if direction != 0.0:
		facing = sign(direction)
		velocity.x = direction * SPEED
		walk_time += delta * 11.0
	else:
		velocity.x = move_toward(velocity.x, 0.0, SPEED * 7.0 * delta)
		walk_time = move_toward(walk_time, 0.0, delta * 8.0)

	if not is_on_floor():
		velocity.y += GRAVITY * delta
	elif Input.is_key_pressed(KEY_SPACE) or Input.is_key_pressed(KEY_UP) or Input.is_key_pressed(KEY_W):
		velocity.y = JUMP_VELOCITY

	move_and_slide()
	queue_redraw()

func _draw() -> void:
	var moving := absf(velocity.x) > 8.0 and is_on_floor()
	var step := sin(walk_time) * 3.0 if moving else 0.0
	var bob := absf(sin(walk_time * 2.0)) * 1.5 if moving else 0.0
	var flip := -1.0 if facing < 0.0 else 1.0
	draw_set_transform(Vector2.ZERO, 0.0, Vector2(flip, 1.0))

	# Ombre au sol
	draw_rect(Rect2(-14, -2, 29, 4), Color(0.12, 0.19, 0.12, 0.28))

	# Queue touffue, rayée brun/noir
	draw_rect(Rect2(-17, -25 - bob, 8, 8), Color("#292321"))
	draw_rect(Rect2(-22, -31 - bob, 8, 10), Color("#65402d"))
	draw_rect(Rect2(-25, -36 - bob, 7, 8), Color("#292321"))
	draw_rect(Rect2(-23, -39 - bob, 5, 4), Color("#8b5938"))

	# Corps brun sombre et tigrures
	draw_rect(Rect2(-13, -25 - bob, 27, 14), Color("#332820"))
	draw_rect(Rect2(-10, -27 - bob, 20, 3), Color("#80502f"))
	draw_rect(Rect2(-7, -23 - bob, 3, 9), Color("#a36a3c"))
	draw_rect(Rect2(1, -24 - bob, 3, 8), Color("#9a6237"))
	draw_rect(Rect2(8, -23 - bob, 3, 7), Color("#a36a3c"))
	# Poitrail crème
	draw_rect(Rect2(8, -21 - bob, 7, 10), Color("#e4d3ad"))
	draw_rect(Rect2(10, -17 - bob, 5, 6), Color("#f0e2c3"))

	# Pattes animées
	var leg_a := step
	var leg_b := -step
	draw_rect(Rect2(-10, -13 + leg_a, 5, 12 - absf(leg_a)), Color("#342820"))
	draw_rect(Rect2(-2, -13 + leg_b, 5, 12 - absf(leg_b)), Color("#533625"))
	draw_rect(Rect2(7, -13 - leg_a, 5, 12 - absf(leg_a)), Color("#2d2521"))
	draw_rect(Rect2(13, -13 - leg_b, 4, 12 - absf(leg_b)), Color("#6b432d"))
	draw_rect(Rect2(-11, -3 + leg_a, 7, 3), Color("#d7c6a5"))
	draw_rect(Rect2(-3, -3 + leg_b, 7, 3), Color("#d7c6a5"))
	draw_rect(Rect2(6, -3 - leg_a, 7, 3), Color("#d7c6a5"))
	draw_rect(Rect2(12, -3 - leg_b, 7, 3), Color("#d7c6a5"))

	# Tête, oreilles et masque tigré
	draw_rect(Rect2(7, -39 - bob, 19, 17), Color("#493124"))
	draw_rect(PackedVector2Array([
		Vector2(9, -36 - bob), Vector2(10, -46 - bob), Vector2(16, -39 - bob)
	]), Color("#493124"))
	draw_rect(PackedVector2Array([
		Vector2(20, -39 - bob), Vector2(25, -46 - bob), Vector2(26, -35 - bob)
	]), Color("#493124"))
	draw_rect(Rect2(10, -36 - bob, 4, 3), Color("#d5a17b"))
	draw_rect(Rect2(21, -36 - bob, 3, 3), Color("#d5a17b"))
	# Joues et museau
	draw_rect(Rect2(10, -30 - bob, 7, 5), Color("#e1d1b1"))
	draw_rect(Rect2(18, -30 - bob, 7, 5), Color("#e1d1b1"))
	draw_rect(Rect2(17, -31 - bob, 3, 2), Color("#b97872"))
	# Yeil vert visible
	draw_rect(Rect2(20, -35 - bob, 3, 3), Color("#a7c95b"))
	draw_rect(Rect2(21, -35 - bob, 1, 3), Color("#20251b"))
	draw_rect(Rect2(13, -38 - bob, 2, 4), Color("#211d1a"))
	draw_rect(Rect2(18, -39 - bob, 2, 4), Color("#211d1a"))
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
