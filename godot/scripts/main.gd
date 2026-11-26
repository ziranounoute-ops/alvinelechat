extends Node2D

const ALVINE_SCRIPT = preload("res://scripts/alvine.gd")

const WORLD_WIDTH := 2400.0
const FLOOR_Y := 224.0

var alvine: CharacterBody2D

func _ready() -> void:
	RenderingServer.set_default_clear_color(Color("#86c9ee"))
	_create_ground()
	_create_alvine()
	_create_camera()

func _process(_delta: float) -> void:
	queue_redraw()

func _draw() -> void:
	# Ciel et lointaines montagnes
	draw_rect(Rect2(-500, -400, WORLD_WIDTH + 1000, 900), Color("#86c9ee"))
	_draw_cloud(Vector2(150, 48), 1.0)
	_draw_cloud(Vector2(590, 34), 0.75)
	_draw_cloud(Vector2(1110, 58), 0.9)
	_draw_cloud(Vector2(1740, 35), 1.1)

	_draw_mountain(80, 175, 260, Color("#91b9a2"))
	_draw_mountain(390, 168, 330, Color("#7da991"))
	_draw_mountain(790, 180, 300, Color("#91b9a2"))
	_draw_mountain(1180, 165, 360, Color("#7da991"))
	_draw_mountain(1640, 180, 310, Color("#91b9a2"))
	_draw_mountain(2050, 170, 340, Color("#7da991"))

	# Collines intermédiaires
	draw_colored_polygon(PackedVector2Array([
		Vector2(-100, 215), Vector2(120, 154), Vector2(360, 205),
		Vector2(610, 160), Vector2(900, 218), Vector2(1200, 158),
		Vector2(1510, 210), Vector2(1800, 160), Vector2(2150, 214),
		Vector2(2500, 170), Vector2(2500, 300), Vector2(-100, 300)
	]), Color("#5d9866"))

	# Sol et petites touffes d'herbe en pixels
	draw_rect(Rect2(-500, FLOOR_Y, WORLD_WIDTH + 1000, 300), Color("#477b43"))
	draw_rect(Rect2(-500, FLOOR_Y, WORLD_WIDTH + 1000, 7), Color("#82b957"))
	for x in range(-400, 2500, 34):
		var h := 5 + int((x * 7) % 8)
		draw_rect(Rect2(x, FLOOR_Y - h, 3, h), Color("#a2d36a"))
		draw_rect(Rect2(x + 7, FLOOR_Y - 4, 2, 4), Color("#d0df79"))

	# Quelques arbres stylisés au bord du chemin
	_draw_tree(300, 184, 1.0)
	_draw_tree(690, 188, 0.8)
	_draw_tree(1050, 180, 1.15)
	_draw_tree(1510, 187, 0.9)
	_draw_tree(1940, 179, 1.1)

func _create_ground() -> void:
	var ground := StaticBody2D.new()
	ground.name = "Ground"
	ground.position = Vector2(WORLD_WIDTH * 0.5, FLOOR_Y + 32.0)
	var shape := CollisionShape2D.new()
	var rectangle := RectangleShape2D.new()
	rectangle.size = Vector2(WORLD_WIDTH, 64)
	shape.shape = rectangle
	ground.add_child(shape)
	add_child(ground)

func _create_alvine() -> void:
	alvine = CharacterBody2D.new()
	alvine.name = "Alvine"
	alvine.set_script(ALVINE_SCRIPT)
	alvine.position = Vector2(100, FLOOR_Y)
	var collision := CollisionShape2D.new()
	var rectangle := RectangleShape2D.new()
	rectangle.size = Vector2(20, 19)
	collision.shape = rectangle
	collision.position = Vector2(0, -9.5)
	alvine.add_child(collision)
	add_child(alvine)

func _create_camera() -> void:
	var camera := Camera2D.new()
	camera.name = "Camera2D"
	camera.position_smoothing_enabled = true
	camera.position_smoothing_speed = 5.0
	camera.limit_left = 0
	camera.limit_right = int(WORLD_WIDTH)
	camera.limit_top = 0
	camera.limit_bottom = 270
	alvine.add_child(camera)
	camera.make_current()

func _draw_cloud(p: Vector2, scale: float) -> void:
	var c := Color("#f1f7e9")
	draw_rect(Rect2(p.x, p.y, 38 * scale, 12 * scale), c)
	draw_rect(Rect2(p.x + 9 * scale, p.y - 7 * scale, 21 * scale, 10 * scale), c)
	draw_rect(Rect2(p.x + 27 * scale, p.y - 3 * scale, 20 * scale, 9 * scale), c)

func _draw_mountain(x: float, base: float, width: float, color: Color) -> void:
	draw_colored_polygon(PackedVector2Array([
		Vector2(x - width * 0.55, base),
		Vector2(x, base - 105),
		Vector2(x + width * 0.18, base - 55),
		Vector2(x + width * 0.48, base - 125),
		Vector2(x + width * 0.72, base)
	]), color)
	draw_colored_polygon(PackedVector2Array([
		Vector2(x - 15, base - 91), Vector2(x, base - 105),
		Vector2(x + 19, base - 88), Vector2(x + 8, base - 92),
		Vector2(x, base - 82)
	]), Color("#e6f0dc"))

func _draw_tree(x: float, y: float, s: float) -> void:
	var sway := sin(Time.get_ticks_msec() * 0.0018 + x) * 2.0
	draw_rect(Rect2(x - 5 * s, y, 11 * s, 40 * s), Color("#76503a"))
	draw_rect(Rect2(x - 2 * s, y + 3 * s, 3 * s, 34 * s), Color("#9a6944"))
	draw_rect(Rect2(x - 22 * s + sway, y - 25 * s, 44 * s, 24 * s), Color("#34764b"))
	draw_rect(Rect2(x - 15 * s + sway, y - 37 * s, 30 * s, 20 * s), Color("#438c50"))
	draw_rect(Rect2(x - 5 * s + sway, y - 43 * s, 17 * s, 12 * s), Color("#6aa85b"))
	draw_rect(Rect2(x - 16 * s + sway, y - 20 * s, 8 * s, 5 * s), Color("#8ab95d"))
