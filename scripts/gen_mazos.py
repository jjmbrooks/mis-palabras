#!/usr/bin/env python3
"""Genera el arte SVG de los mazos Animales, Cumpleaños y Navidad (docs/estilo-mazos-nuevos.md).
Mismo estilo que «Abejas y jardín»: objeto kawaii con cara, degradados radiales suaves, reflejo arriba
a la izquierda, sin contorno negro, sombra difusa. Arte original escrito por código, sin referencias externas.
Uso: python3 scripts/gen_mazos.py  → escribe src/art/<id>.svg"""
import os
OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'art')
BROWN = '#48321b'

class Art:
    def __init__(s): s.defs, s.body, s.n = [], [], 0
    def g(s, c1, c2, c3=None, cx='35%', cy='30%', r='80%'):
        s.n += 1; i = f'g{s.n}'
        stops = [(0, c1), (.55 if c3 else 1, c2)] + ([(1, c3)] if c3 else [])
        s.defs.append(f'<radialGradient id="{i}" cx="{cx}" cy="{cy}" r="{r}">' + ''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops) + '</radialGradient>')
        return f'url(#{i})'
    def add(s, x): s.body.append(x); return s
    def ell(s, cx, cy, rx, ry, fill, extra=''): return s.add(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{fill}" {extra}/>')
    def circ(s, cx, cy, r, fill, extra=''): return s.add(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" {extra}/>')
    def path(s, d, fill, extra=''): return s.add(f'<path d="{d}" fill="{fill}" {extra}/>')
    def rect(s, x, y, w, h, rx, fill, extra=''): return s.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" {extra}/>')
    def shine(s, cx, cy, rx, ry, rot=-30): return s.add(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="#fff" opacity=".45" transform="rotate({rot} {cx} {cy})"/>')
    def face(s, cx, cy, k=1.0, dx=None):
        dx = dx or 17 * k; r = 8 * k
        ck = s.g('#f4a0a0', '#f4a0a0', None, '50%', '50%', '50%'); s.defs[-1] = s.defs[-1].replace('<stop offset="1" stop-color="#f4a0a0"/>', '<stop offset="1" stop-color="#f4a0a0" stop-opacity="0"/>')
        for sx in (-1, 1):
            x = cx + sx * dx
            s.circ(x, cy, r, BROWN, f'stroke="#2e1f10" stroke-width="{.8*k:.1f}"')
            s.circ(x - 2.6 * k, cy - 2.8 * k, 2.8 * k, '#fff'); s.circ(x + 2.4 * k, cy + 2.4 * k, 1.2 * k, '#fff')
            s.ell(x + sx * 9 * k, cy + 11 * k, 7 * k, 4.5 * k, ck)
        s.path(f'M{cx-7*k:.1f} {cy+9*k:.1f} Q{cx} {cy+17*k:.1f} {cx+7*k:.1f} {cy+9*k:.1f}', 'none', f'stroke="{BROWN}" stroke-width="{2.6*k:.1f}" stroke-linecap="round"')
        return s
    def svg(s):
        sh = '<radialGradient id="sh" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>'
        return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs>' + ''.join(s.defs) + sh + '</defs>'
                '<ellipse cx="100" cy="188" rx="62" ry="8" fill="url(#sh)"/>' + ''.join(s.body) + '</svg>')

def animal_head(a, cx, cy, r, c1, c2, c3):
    a.circ(cx, cy, r, a.g(c1, c2, c3)); a.shine(cx - r * .4, cy - r * .5, r * .3, r * .16)

W = {}
def art(fn): W[fn.__name__] = fn; return fn

# ---------- ANIMALES ----------
@art
def perro():
    a = Art(); b = a.g('#f7dcb0', '#d9a066', '#a8682e')
    a.ell(100, 150, 48, 34, b); a.ell(54, 88, 16, 34, a.g('#a8682e', '#6e3f17'), 'transform="rotate(20 54 88)"'); a.ell(146, 88, 16, 34, a.g('#a8682e', '#6e3f17'), 'transform="rotate(-20 146 88)"')
    animal_head(a, 100, 95, 50, '#fbe6c4', '#e0aa6c', '#b5763a'); a.ell(100, 118, 22, 15, '#fff3e2'); a.ell(100, 109, 8, 6, BROWN)
    return a.face(100, 92, 1, 21)
@art
def gato():
    a = Art(); b = a.g('#ffe2b8', '#f5a547', '#c86a12')
    a.ell(100, 152, 44, 32, b); a.path('M150 160 Q190 150 175 110', 'none', 'stroke="#e0892a" stroke-width="10" stroke-linecap="round"')
    a.path('M56 80 L62 36 L92 62 Z', '#f0952e'); a.path('M144 80 L138 36 L108 62 Z', '#f0952e'); a.path('M64 70 L66 48 L82 62 Z', '#ffc2cf'); a.path('M136 70 L134 48 L118 62 Z', '#ffc2cf')
    animal_head(a, 100, 98, 48, '#ffe9c7', '#f8ad55', '#d4761c'); a.path('M95 112 L105 112 L100 118 Z', '#ff8fa8')
    for y in (110, 117): a.path(f'M70 {y} L48 {y-4} M130 {y} L152 {y-4}', 'none', 'stroke="#c47a3a" stroke-width="2" stroke-linecap="round"')
    return a.face(100, 94, 1, 20)
@art
def vaca():
    a = Art(); a.ell(100, 154, 50, 30, a.g('#ffffff', '#ecebe8', '#c9c6bf'))
    a.path('M58 62 Q46 40 60 34 Q62 50 72 58Z', '#e8d6a8'); a.path('M142 62 Q154 40 140 34 Q138 50 128 58Z', '#e8d6a8')
    a.ell(50, 80, 16, 9, '#f2c9c9'); a.ell(150, 80, 16, 9, '#f2c9c9')
    animal_head(a, 100, 92, 46, '#ffffff', '#f1efea', '#cfcac0'); a.ell(76, 74, 14, 11, '#6b5a4c'); a.ell(128, 110, 9, 7, '#6b5a4c')
    a.ell(100, 124, 30, 18, a.g('#ffd6dc', '#f5a3b0')); a.ell(90, 124, 3.5, 4.5, '#b9667a'); a.ell(110, 124, 3.5, 4.5, '#b9667a')
    return a.face(100, 92, .95, 19)
@art
def pato():
    a = Art(); a.ell(104, 150, 54, 32, a.g('#fff6b0', '#ffd42e', '#e0a500')); a.path('M150 140 Q178 126 168 150 Q160 160 148 158Z', '#f2bd10')
    animal_head(a, 92, 88, 42, '#fff8c4', '#ffd93d', '#e6ad00'); a.ell(92, 114, 24, 9, a.g('#ffc27a', '#ff8a1f', '#d96400'))
    return a.face(92, 84, .95, 17)
@art
def leon():
    a = Art(); mane = a.g('#f0a64a', '#c86b16', '#8e4708')
    for i in range(12):
        import math; t = i * math.pi / 6; a.circ(100 + 52 * math.cos(t), 100 + 52 * math.sin(t), 22, mane)
    a.circ(100, 100, 52, mane); animal_head(a, 100, 100, 44, '#ffeaa6', '#f7c35a', '#d6922a')
    a.circ(66, 66, 10, '#e9a53d'); a.circ(134, 66, 10, '#e9a53d'); a.ell(100, 120, 16, 11, '#fff3cf'); a.path('M93 113 L107 113 L100 120Z', '#8e4708')
    return a.face(100, 96, .95, 18)
@art
def oso():
    a = Art(); a.ell(100, 154, 46, 30, a.g('#c48a57', '#8d5527', '#5e3412'))
    a.circ(62, 58, 16, '#8d5527'); a.circ(138, 58, 16, '#8d5527'); a.circ(62, 58, 8, '#d9a679'); a.circ(138, 58, 8, '#d9a679')
    animal_head(a, 100, 96, 48, '#d39c69', '#9d6132', '#6b3c17'); a.ell(100, 118, 20, 14, '#e8c39d'); a.ell(100, 110, 8, 5.5, BROWN)
    return a.face(100, 92, 1, 20)
@art
def pez():
    a = Art(); a.path('M150 100 L186 70 Q178 100 186 130 Z', a.g('#9fe0ff', '#3d9be0'))
    a.ell(96, 100, 62, 46, a.g('#c8f0ff', '#58b6f0', '#2a7cc4')); a.path('M90 56 Q110 34 128 60Z', '#3d9be0'); a.path('M96 140 Q112 160 124 138Z', '#3d9be0')
    a.shine(70, 76, 20, 9); return a.face(82, 98, .95, 16)
@art
def mono():
    a = Art(); a.path('M140 160 Q186 160 176 120 Q170 104 160 112', 'none', 'stroke="#8a5a32" stroke-width="9" stroke-linecap="round"')
    a.ell(100, 156, 42, 28, a.g('#b98454', '#8a5a32', '#5c3818')); a.circ(52, 96, 16, '#8a5a32'); a.circ(148, 96, 16, '#8a5a32'); a.circ(52, 96, 9, '#f2c9a0'); a.circ(148, 96, 9, '#f2c9a0')
    animal_head(a, 100, 96, 46, '#b98454', '#8a5a32', '#5c3818'); a.path('M66 96 Q66 70 92 76 Q100 70 108 76 Q134 70 134 96 Q138 132 100 134 Q62 132 66 96Z', a.g('#ffe2c2', '#f2c9a0'))
    return a.face(100, 94, .95, 15)
@art
def cerdo():
    a = Art(); a.ell(100, 154, 50, 30, a.g('#ffd6e0', '#ffa3ba', '#e07892'))
    a.path('M58 68 L56 38 L84 56Z', '#f58fa9'); a.path('M142 68 L144 38 L116 56Z', '#f58fa9')
    animal_head(a, 100, 96, 48, '#ffe1e8', '#ffadc2', '#e8839d'); a.ell(100, 120, 18, 12, a.g('#ffc4d2', '#f2889f')); a.ell(93, 120, 3.5, 5, '#b8516a'); a.ell(107, 120, 3.5, 5, '#b8516a')
    return a.face(100, 92, .95, 20)
@art
def burro():
    a = Art(); a.ell(100, 156, 46, 28, a.g('#d0cdd2', '#9a959e', '#6a6570'))
    a.ell(72, 46, 11, 32, '#9a959e', 'transform="rotate(-14 72 46)"'); a.ell(128, 46, 11, 32, '#9a959e', 'transform="rotate(14 128 46)"'); a.ell(72, 48, 5, 22, '#f2c9d2', 'transform="rotate(-14 72 48)"'); a.ell(128, 48, 5, 22, '#f2c9d2', 'transform="rotate(14 128 48)"')
    a.ell(100, 102, 42, 50, a.g('#dcd9de', '#a7a2ab', '#77727d')); a.ell(100, 134, 28, 18, '#efe9e2'); a.ell(92, 134, 3, 4, '#6a6570'); a.ell(108, 134, 3, 4, '#6a6570')
    a.path('M88 54 Q100 40 112 54 Q100 50 88 54Z', '#4d4852'); return a.face(100, 94, .9, 18)
@art
def tortuga():
    a = Art(); g = '#8fd17a'
    for x, y in ((56, 150), (144, 150), (64, 120), (136, 120)): a.ell(x, y, 14, 11, g)
    a.circ(164, 118, 22, a.g('#c6efa8', '#7cc35f', '#4f9a3a'))
    a.path('M40 140 Q40 72 104 70 Q160 72 160 140Z', a.g('#a3e07a', '#4fae3e', '#2f7a28')); a.rect(36, 132, 128, 14, 7, '#e0c46a')
    for cx, cy in ((80, 110), (126, 110), (103, 94)): a.path(f'M{cx-12} {cy} L{cx-6} {cy-11} L{cx+6} {cy-11} L{cx+12} {cy} L{cx+6} {cy+11} L{cx-6} {cy+11}Z', '#3d8f33', 'opacity=".5"')
    a.shine(70, 88, 16, 7); return a.face(164, 116, .6, 9)
@art
def jirafa():
    a = Art(); y = a.g('#ffe9a8', '#f7c548', '#d99a1a')
    a.rect(84, 92, 32, 86, 14, y); a.ell(100, 70, 34, 32, a.g('#fff0b8', '#f8cb52', '#dc9e1e'))
    a.rect(80, 26, 6, 18, 3, '#c7861a'); a.rect(114, 26, 6, 18, 3, '#c7861a'); a.circ(83, 26, 6, '#9a5f12'); a.circ(117, 26, 6, '#9a5f12')
    a.ell(64, 54, 13, 7, '#f0b53c', 'transform="rotate(-25 64 54)"'); a.ell(136, 54, 13, 7, '#f0b53c', 'transform="rotate(25 136 54)"')
    for x, yy, r in ((92, 116, 6), (108, 134, 7), (94, 156, 6), (110, 166, 5), (76, 60, 5), (122, 86, 5)): a.circ(x, yy, r, '#c97f1c', 'opacity=".75"')
    a.ell(100, 88, 18, 11, '#ffe7b0'); return a.face(100, 66, .8, 15)
@art
def elefante():
    a = Art(); grey = a.g('#d9e2ee', '#9fb0c6', '#6d7f99')
    a.ell(48, 92, 32, 40, a.g('#e8c6d3', '#a8b6cb', '#7889a2')); a.ell(152, 92, 32, 40, a.g('#e8c6d3', '#a8b6cb', '#7889a2'))
    a.ell(100, 156, 46, 26, grey); a.circ(100, 92, 48, grey); a.shine(80, 64, 14, 7)
    a.path('M90 112 Q86 150 108 162 Q120 166 118 154 Q102 148 110 112Z', a.g('#c8d3e2', '#91a3bb'))
    return a.face(100, 88, .95, 22)
@art
def caballo():
    a = Art(); a.path('M70 50 Q60 110 72 150 L90 150 Q84 100 96 56Z', '#5a3418')
    a.ell(108, 100, 40, 54, a.g('#dba36e', '#a8642c', '#6e3d14'), 'transform="rotate(8 108 100)"')
    a.path('M80 52 L84 26 L98 46Z', '#a8642c'); a.path('M126 50 L132 24 L140 48Z', '#a8642c')
    a.ell(116, 142, 30, 20, '#e8c09a'); a.ell(106, 144, 3.5, 4.5, '#6e3d14'); a.ell(126, 144, 3.5, 4.5, '#6e3d14')
    a.path('M86 46 Q104 30 128 44 Q108 44 96 60Z', '#5a3418'); return a.face(110, 100, .9, 18)
@art
def gallina():
    a = Art(); a.ell(100, 128, 52, 46, a.g('#ffffff', '#f2eee6', '#cfc6b6')); a.path('M144 110 Q178 92 170 130 Q162 146 146 140Z', '#ebe4d8')
    a.path('M82 58 Q86 40 96 52 Q102 36 110 52 Q120 42 118 64Z', a.g('#ff8a7a', '#e2362a')); a.ell(100, 92, 36, 34, a.g('#ffffff', '#f4f0e8', '#d6cdbd'))
    a.path('M92 102 L108 102 L100 114Z', '#ffa526'); a.ell(100, 120, 6, 9, '#e2362a')
    a.ell(64, 146, 9, 4, '#ffa526'); a.ell(136, 146, 9, 4, '#ffa526'); return a.face(100, 90, .85, 15)

# ---------- CUMPLEAÑOS ----------
@art
def pastel():
    a = Art(); a.rect(46, 96, 108, 70, 16, a.g('#ffe3ec', '#ffb3c8', '#e9819f'))
    a.path('M46 112 Q58 128 70 112 Q82 128 94 112 Q106 128 118 112 Q130 128 142 112 Q150 124 154 112 L154 104 Q154 96 140 96 L60 96 Q46 96 46 104Z', '#fff6f8')
    a.rect(96, 62, 8, 34, 3, a.g('#c7e8ff', '#5aa9e6')); a.path('M100 40 Q110 54 100 62 Q90 54 100 40Z', a.g('#fff2a0', '#ffb21a', '#ff7a00'))
    for x in (64, 86, 116, 138): a.circ(x, 158, 4, '#e2366a')
    a.shine(66, 104, 12, 5, 0); return a.face(100, 132, .85, 22)
@art
def pinata():
    a = Art(); body = a.g('#ffe08a', '#ffb81c', '#e08a00')
    import math
    for i in range(7):
        t = -math.pi / 2 + i * 2 * math.pi / 7; x, y = 100 + 58 * math.cos(t), 104 + 58 * math.sin(t)
        col = ['#ff5d8f', '#36c2b4', '#ffd23f', '#8d6bf2', '#ff8a3d', '#4fb3ff', '#7ad151'][i]
        a.path(f'M{100+30*math.cos(t-.35):.1f} {104+30*math.sin(t-.35):.1f} L{x:.1f} {y:.1f} L{100+30*math.cos(t+.35):.1f} {104+30*math.sin(t+.35):.1f}Z', col)
        a.circ(x, y, 6, col)
    a.circ(100, 104, 36, body); a.shine(86, 86, 10, 5); return a.face(100, 102, .85, 15)
@art
def globo():
    a = Art(); a.path('M100 138 Q90 160 104 176 Q114 188 100 196', 'none', 'stroke="#b9a6c9" stroke-width="2"')
    a.ell(100, 82, 50, 58, a.g('#ffc4d6', '#ff5d8f', '#c9235a')); a.path('M92 140 L108 140 L100 130Z', '#d3326a')
    a.shine(78, 54, 14, 8); return a.face(100, 86, 1, 19)
@art
def vela():
    a = Art(); a.ell(100, 172, 40, 9, '#d9c7a8'); a.rect(72, 72, 56, 100, 18, a.g('#fff8ec', '#ffe7c4', '#eac08a'))
    a.path('M72 92 Q86 100 92 90 Q100 104 110 90 Q118 102 128 92 L128 86 Q128 72 110 72 L90 72 Q72 72 72 86Z', '#fffdf8')
    a.rect(98, 56, 4, 16, 2, '#6b4a2a'); a.path('M100 20 Q118 44 100 58 Q82 44 100 20Z', a.g('#fff6b0', '#ffc21a', '#ff7f00'))
    a.shine(84, 106, 6, 16, 0); return a.face(100, 124, .9, 15)
@art
def regalo():
    a = Art(); box = a.g('#c8f2ff', '#4fb3ff', '#2479c7')
    a.rect(46, 88, 108, 84, 12, box); a.rect(40, 72, 120, 26, 10, a.g('#d8f6ff', '#66c1ff', '#2c86d4'))
    a.rect(92, 72, 16, 100, 3, '#ff5d8f'); a.path('M100 72 Q70 40 66 62 Q64 76 100 72 Q130 40 134 62 Q136 76 100 72Z', '#ff5d8f')
    a.shine(62, 100, 8, 14, 0); return a.face(100, 128, .9, 26)
@art
def dulces():
    a = Art()
    for cx, cy, c1, c2, rot in ((62, 124, '#ffd0e4', '#ff5d8f', -20), (138, 124, '#d4f5c4', '#53c247', 20)):
        a.path(f'M{cx-28} {cy-12} L{cx-46} {cy-26} L{cx-46} {cy+26} L{cx-28} {cy+12}Z', c2, f'transform="rotate({rot} {cx} {cy})"')
        a.path(f'M{cx+28} {cy-12} L{cx+46} {cy-26} L{cx+46} {cy+26} L{cx+28} {cy+12}Z', c2, f'transform="rotate({rot} {cx} {cy})"')
        a.ell(cx, cy, 30, 22, a.g(c1, c2), f'transform="rotate({rot} {cx} {cy})"')
    a.circ(100, 86, 40, a.g('#fff2b0', '#ffc21a', '#e08a00')); a.path('M100 86 m-24 0 a24 24 0 0 1 48 0', 'none', 'stroke="#fff" stroke-width="5" opacity=".6"')
    a.shine(84, 66, 10, 5); return a.face(100, 86, .8, 15)
@art
def gorro():
    a = Art(); a.path('M100 26 L150 166 L50 166Z', a.g('#e4d6ff', '#9b7bf2', '#6345c4'))
    for y, c in ((70, '#ffd23f'), (110, '#ff5d8f'), (146, '#36c2b4')): a.circ(100 + (y - 110) * .1, y, 7, c)
    a.circ(100, 24, 12, a.g('#fff2b0', '#ffc21a')); a.ell(100, 166, 56, 12, a.g('#fff', '#f2eefc'))
    return a.face(100, 124, .75, 17)
@art
def fiesta():
    a = Art(); import math
    for i, c in enumerate(['#ff5d8f', '#36c2b4', '#ffd23f', '#8d6bf2', '#4fb3ff', '#ff8a3d']):
        t = -math.pi * (.15 + i * .14); a.rect(100 + 70 * math.cos(t), 80 + 70 * math.sin(t), 8, 14, 2, c, f'transform="rotate({i*30} {100+70*math.cos(t)} {80+70*math.sin(t)})"')
    a.path('M60 160 L104 66 L140 160Z', a.g('#fff2b0', '#ffc21a', '#e08a00'), 'transform="rotate(-18 100 120)"')
    for i, c in enumerate(['#ff5d8f', '#36c2b4', '#8d6bf2']): a.path(f'M{96+i*10} 62 Q{80+i*14} {38-i*6} {70+i*20} {26}', 'none', f'stroke="{c}" stroke-width="5" stroke-linecap="round"', ) if False else a.path(f'M{98+i*6} 60 Q{84+i*18} 40 {78+i*26} 24', 'none', f'stroke="{c}" stroke-width="5" stroke-linecap="round"')
    return a.face(100, 128, .8, 15)
@art
def tacos():
    a = Art()
    for cx, rot in ((70, -12), (130, 12)):
        a.path(f'M{cx-46} 150 Q{cx} 50 {cx+46} 150Z', a.g('#fff1b8', '#f3c75a', '#cf9420'), f'transform="rotate({rot} {cx} 120)"')
        a.path(f'M{cx-36} 132 Q{cx-20} 108 {cx} 118 Q{cx+20} 104 {cx+36} 132', 'none', f'stroke="#5cbf4f" stroke-width="9" stroke-linecap="round" transform="rotate({rot} {cx} 120)"')
        a.circ(cx - 8, 116, 5, '#e2362a', f'transform="rotate({rot} {cx} 120)"'); a.circ(cx + 12, 112, 4, '#e2362a', f'transform="rotate({rot} {cx} 120)"')
    a.face(70, 136, .6, 11); return a.face(130, 136, .6, 11)
@art
def gelatina():
    a = Art(); a.ell(100, 166, 62, 12, a.g('#ffffff', '#dfe8ee'))
    a.path('M50 162 L58 84 Q100 64 142 84 L150 162 Q100 174 50 162Z', a.g('#ffd1dc', '#ff4f7b', '#c51f4d'), 'opacity=".95"')
    a.path('M58 84 Q72 96 86 84 Q100 96 114 84 Q128 96 142 84', 'none', 'stroke="#fff" stroke-width="4" opacity=".5"')
    a.circ(100, 60, 11, '#e2142f'); a.path('M100 50 Q106 36 116 34', 'none', 'stroke="#3e9a3a" stroke-width="3"')
    a.shine(72, 106, 7, 20, 10); return a.face(100, 124, .9, 18)
@art
def nieve():
    a = Art(); a.path('M70 108 L100 186 L130 108Z', a.g('#ffe9b8', '#e8b25e', '#b97c2a'))
    for x in (85, 100, 115): a.path(f'M{x-10} 130 L{x} 150 M{x+10} 130 L{x} 150', 'none', 'stroke="#c8913f" stroke-width="2"')
    a.circ(84, 92, 26, a.g('#ffe2ef', '#ffa6c8', '#e06d9b')); a.circ(116, 92, 26, a.g('#e6fff0', '#9fe6bd', '#4fbf86')); a.circ(100, 66, 26, a.g('#fffaf0', '#fff0d6', '#e6cfa6'))
    a.shine(90, 52, 8, 4); return a.face(100, 74, .75, 13)
@art
def amigos():
    a = Art()
    for cx, c1, c2, c3, hair in ((68, '#fde0c8', '#f2bd98', '#d09168', '#6b3c17'), (132, '#e9c39f', '#c68e62', '#94613b', '#2e1f10')):
        a.rect(cx - 30, 120, 60, 58, 24, a.g(*(('#ffd0e4', '#ff7aa8') if cx < 100 else ('#c8f2ff', '#4fb3ff'))))
        a.circ(cx, 88, 32, a.g(c1, c2, c3)); a.path(f'M{cx-32} 84 Q{cx-30} 50 {cx} 54 Q{cx+30} 50 {cx+32} 84 Q{cx} 66 {cx-32} 84Z', hair)
        a.face(cx, 92, .62, 12)
    a.path('M92 148 Q100 140 108 148', 'none', 'stroke="#f2bd98" stroke-width="10" stroke-linecap="round"'); return a

# ---------- NAVIDAD ----------
@art
def arbol_navidad():
    a = Art(); a.rect(90, 150, 20, 26, 4, '#8b5a2b')
    g = a.g('#a8e89a', '#3e9a3a', '#22682a')
    for y, w in ((150, 62), (116, 50), (82, 36)): a.path(f'M{100-w} {y} Q100 {y-6} {100+w} {y} L100 {y-56}Z', g)
    for x, y, c in ((70, 140, '#ff5d8f'), (130, 136, '#4fb3ff'), (84, 104, '#ffd23f'), (120, 100, '#ff5d8f'), (100, 70, '#4fb3ff')): a.circ(x, y, 5, c)
    a.path('M100 14 L105 26 L118 27 L108 35 L111 48 L100 41 L89 48 L92 35 L82 27 L95 26Z', '#ffd23f')
    return a.face(100, 120, .75, 15)
@art
def estrella():
    a = Art(); import math
    pts = ' '.join(f'{100+(70 if i%2==0 else 32)*math.cos(-math.pi/2+i*math.pi/5):.1f},{100+(70 if i%2==0 else 32)*math.sin(-math.pi/2+i*math.pi/5):.1f}' for i in range(10))
    a.add(f'<polygon points="{pts}" fill="{a.g("#fff6b0", "#ffd23f", "#e8a400")}" stroke="#ffd23f" stroke-width="14" stroke-linejoin="round"/>')
    a.shine(80, 72, 10, 5); return a.face(100, 104, .85, 15)
@art
def bota():
    a = Art(); a.path('M66 48 L122 48 L122 120 Q170 120 166 152 Q164 172 140 172 L74 172 Q62 172 62 160Z', a.g('#ff9a9a', '#e2362a', '#a81e16'))
    a.rect(58, 34, 72, 26, 12, a.g('#ffffff', '#eeeeee', '#cfcfcf')); a.circ(150, 160, 0.1, '#fff')
    a.shine(78, 80, 6, 16, 0); return a.face(94, 104, .85, 15)
@art
def ponche():
    a = Art(); a.ell(100, 168, 52, 10, '#a5582b')
    a.path('M48 86 L56 162 Q100 178 144 162 L152 86Z', a.g('#e8a473', '#b9622a', '#7e3a12')); a.ell(100, 86, 52, 13, a.g('#ffb36b', '#e9762a'))
    for x, c in ((80, '#ffd23f'), (104, '#e2362a'), (124, '#ffb21a')): a.circ(x, 84, 7, c)
    a.path('M150 102 Q178 104 172 128 Q166 146 146 140', 'none', 'stroke="#b9622a" stroke-width="9"')
    a.path('M90 64 Q84 50 92 38 M110 64 Q104 50 112 36', 'none', 'stroke="#d8d0c6" stroke-width="4" stroke-linecap="round" opacity=".8"')
    a.rect(124, 40, 7, 50, 3, '#8b4a1e', 'transform="rotate(18 127 65)"'); return a.face(100, 124, .85, 18)
@art
def bunuelo():
    a = Art(); a.ell(100, 112, 70, 54, a.g('#ffe9a8', '#e8b04e', '#b8761e'))
    for x, y in ((70, 96), (128, 98), (98, 140), (60, 128), (140, 132), (96, 76)): a.ell(x, y, 9, 6, '#f7d07a', 'opacity=".9"')
    for x, y in ((80, 84), (120, 82), (110, 130), (76, 140), (140, 112)): a.circ(x, y, 3, '#fff')
    a.shine(64, 82, 14, 6); return a.face(100, 108, .9, 18)
@art
def nacimiento():
    a = Art(); a.path('M30 92 L100 40 L170 92 L160 96 L100 54 L40 96Z', a.g('#d8a06a', '#a8642c'))
    a.rect(44, 92, 112, 84, 4, a.g('#f3d9b0', '#d9b07a', '#a8783c'), 'opacity=".55"')
    a.path('M60 176 L72 140 L128 140 L140 176Z', a.g('#e8c07a', '#c79a4a')); a.path('M70 140 Q100 128 130 140', 'none', 'stroke="#f7df9a" stroke-width="6"')
    a.ell(100, 132, 24, 13, a.g('#fff8ec', '#f2e3c8')); a.circ(100, 120, 13, a.g('#fde0c8', '#f2bd98'))
    a.path('M100 10 L104 20 L115 21 L107 28 L109 39 L100 33 L91 39 L93 28 L85 21 L96 20Z', '#ffd23f'); return a.face(100, 120, .4, 6)
@art
def esfera():
    a = Art(); a.rect(90, 30, 20, 16, 4, a.g('#fff2b0', '#e8b400')); a.path('M100 30 Q92 16 100 12 Q108 16 100 30', 'none', 'stroke="#c9a400" stroke-width="3"')
    a.circ(100, 108, 62, a.g('#ffb3c8', '#e2366a', '#9c1440')); a.path('M42 98 Q100 118 158 98', 'none', 'stroke="#ffd23f" stroke-width="7" opacity=".9"')
    a.shine(76, 74, 18, 9); return a.face(100, 122, 1, 21)
@art
def campana():
    a = Art(); a.path('M100 34 Q146 34 148 96 Q150 136 172 150 L28 150 Q50 136 52 96 Q54 34 100 34Z', a.g('#fff2b0', '#ffc21a', '#c98a00'))
    a.circ(100, 160, 13, a.g('#ffe08a', '#d99a00')); a.path('M84 30 Q100 12 116 30', 'none', 'stroke="#e2362a" stroke-width="8" stroke-linecap="round"')
    a.path('M70 34 Q60 20 80 22 Q90 26 84 34Z', '#e2362a'); a.path('M130 34 Q140 20 120 22 Q110 26 116 34Z', '#e2362a')
    a.shine(74, 70, 9, 18, 10); return a.face(100, 104, .95, 20)

if __name__ == '__main__':
    for k, fn in W.items():
        with open(os.path.join(OUT, f'{k}.svg'), 'w') as f: f.write(fn().svg() + '\n')
    print(len(W), 'SVG')
