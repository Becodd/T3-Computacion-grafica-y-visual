"""Texturas procedurales sin costuras: asfalto, concreto y fachada de edificio (con ventanas).
Uso (raiz del proyecto): python3 tools/generar_texturas.py   (requiere numpy y Pillow)"""
import numpy as np
from PIL import Image, ImageDraw
S = 512

def fbm(beta, seed):
    r = np.random.default_rng(seed); f = np.fft.fftfreq(S)
    k = np.sqrt(f[:, None] ** 2 + f[None, :] ** 2); k[0, 0] = 1
    spec = (r.normal(size=(S, S)) + 1j * r.normal(size=(S, S))) / k ** (beta / 2 + 0.5); spec[0, 0] = 0
    n = np.real(np.fft.ifft2(spec)); return (n - n.min()) / (n.max() - n.min())

def save(a, name): Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(f"assets/textures/{name}", quality=90)

# asfalto con grano fino y manchas
g = 0.5 * fbm(2.4, 1) + 0.3 * fbm(1.2, 2) + 0.2 * fbm(0.4, 3)
save(np.stack([g * 70 + 28, g * 72 + 30, g * 78 + 34], -1), "asfalto.jpg")

# concreto
c = 0.55 * fbm(2.6, 4) + 0.3 * fbm(1.5, 5) + 0.15 * fbm(0.5, 6)
base = np.stack([c * 110 + 70, c * 108 + 68, c * 100 + 62], -1)
save(base, "concreto.jpg")

# fachada: concreto oscuro + ventana por baldosa (la textura se repite cada 4 m x 4 m)
c2 = 0.6 * fbm(2.6, 7) + 0.4 * fbm(1.4, 8)
img = Image.fromarray(np.clip(np.stack([c2 * 80 + 55, c2 * 74 + 52, c2 * 70 + 50], -1), 0, 255).astype(np.uint8))
d = ImageDraw.Draw(img); rng = np.random.default_rng(9)
d.rectangle([150, 130, 362, 330], fill=(20, 24, 30)); d.rectangle([150, 130, 362, 330], outline=(95, 92, 88), width=10)
d.line([256, 130, 256, 330], fill=(95, 92, 88), width=6); d.line([150, 230, 362, 230], fill=(95, 92, 88), width=6)
d.polygon([(160, 140), (240, 140), (170, 225)], fill=(36, 44, 56))      # reflejo
d.line([(300, 140), (340, 190), (312, 230)], fill=(60, 66, 74), width=3)  # grieta del vidrio
d.rectangle([140, 335, 372, 352], fill=(78, 74, 70))                      # alfeizar
img.save("assets/textures/edificio.jpg", quality=90)
print("Texturas generadas")
