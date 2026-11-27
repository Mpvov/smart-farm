import time
from yolobit import *
button_a.on_pressed = None
button_b.on_pressed = None
button_a.on_pressed_ab = button_b.on_pressed_ab = -1
from aiot_lcd1602 import LCD1602
from aiot_rgbled import RGBLed
import sys
import uselect
from event_manager import *
from machine import Pin, SoftI2C
from aiot_dht20 import DHT20

aiot_lcd1602 = LCD1602()

tiny_rgb = RGBLed(pin16.pin, 4)

def read_terminal_input():
  spoll=uselect.poll()        # Set up an input polling object.
  spoll.register(sys.stdin, uselect.POLLIN)    # Register polling object.

  input = ''
  if spoll.poll(0):
    input = sys.stdin.read(1)

    while spoll.poll(0):
      input = input + sys.stdin.read(1)

  spoll.unregister(sys.stdin)
  return input

event_manager.reset()

def on_event_condition_callback_a_H_H_V_d():
  global cmd, temp, humi, soil, light, pump, led
  if pump == 0:
    pump = 1
    pin0.write_digital((1))
    print('!1:PUMP:ON#', end =' ')
    display.scroll('P-ON')
  else:
    pump = 0
    pin0.write_digital((0))
    print('!1:PUMP:OFF#', end =' ')
    display.scroll('P-OFF')

event_manager.add_condition_event(lambda:(button_a.is_pressed()), on_event_condition_callback_a_H_H_V_d)

aiot_dht20 = DHT20()

def on_event_timer_callback_t_z_G_f_O():
  global cmd, temp, humi, soil, light, pump, led
  aiot_dht20.read_dht20()
  temp = aiot_dht20.dht20_temperature()
  humi = aiot_dht20.dht20_humidity()
  soil = round(translate((pin1.read_analog()), 0, 4095, 0, 100))
  light = round(translate((pin2.read_analog()), 0, 4095, 0, 100))
  aiot_lcd1602.move_to(0, 0)
  aiot_lcd1602.putstr((''.join([str(x) for x in ['T:', temp, 'H:', humi]])))
  aiot_lcd1602.move_to(0, 1)
  aiot_lcd1602.putstr((''.join([str(x2) for x2 in ['S:', soil, 'L:', light]])))
  print((''.join([str(x3) for x3 in ['!1:TEMP:', temp, '#']])), end =' ')
  print((''.join([str(x4) for x4 in ['!1:HUMI:', humi, '#']])), end =' ')
  print((''.join([str(x5) for x5 in ['!1:SOIL:', soil, '#']])), end =' ')
  print((''.join([str(x6) for x6 in ['!1:LIGHT:', light, '#']])), end =' ')

event_manager.add_timer_event(15000, on_event_timer_callback_t_z_G_f_O)

def on_event_condition_callback_g_Q_v_r_A():
  global cmd, temp, humi, soil, light, pump, led
  if led == 0:
    led = 1
    tiny_rgb.show(0, hex_to_rgb('#ffffff'))
    print('!1:LED:ON#', end =' ')
    display.scroll('L-ON')
  else:
    led = 0
    tiny_rgb.show(0, hex_to_rgb('#000000'))
    print('!1:LED:OFF#', end =' ')
    display.scroll('L-OFF')

event_manager.add_condition_event(lambda:(button_b.is_pressed()), on_event_condition_callback_g_Q_v_r_A)

if True:
  display.scroll('OK')
  aiot_lcd1602.backlight_on()
  aiot_lcd1602.clear()
  pin0.set_pull("down")
  tiny_rgb.show(0, hex_to_rgb('#000000'))
  pump = 0
  led = 0

while True:
  cmd = read_terminal_input()
  if cmd == '!1:PUMP:ON#':
    pin0.write_digital((1))
    pump = 1
    display.scroll('P-ON')
  if cmd == '!1:PUMP:OFF#':
    pin0.write_digital((0))
    pump = 0
    display.scroll('P-OFF')
  if cmd == '!1:LED:ON#':
    led = 1
    tiny_rgb.show(0, hex_to_rgb('#ffffff'))
    display.scroll('L-ON')
  if cmd == '!1:LED:OFF#':
    led = 0
    tiny_rgb.show(0, hex_to_rgb('#000000'))
    display.scroll('L-OFF')
  event_manager.run()
  time.sleep_ms(100)
  time.sleep_ms(10)
