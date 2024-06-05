import domready from "domready"
import spectral from "spectral.js"
import { createNoise3D } from "simplex-noise"
import "./style.css"
import randomPalette from "./randomPalette"
import { wrap } from "./util"

const PHI = (1 + Math.sqrt(5)) / 2;
const TAU = Math.PI * 2;
const DEG2RAD_FACTOR = TAU / 360;

const config = {
    width: 0,
    height: 0
};

function doubleExponentialSigmoid (x, a){

    const epsilon = 0.00001;
    const min_param_a = 0.0 + epsilon;
    const max_param_a = 1.0 - epsilon;
    a = Math.min(max_param_a, Math.max(min_param_a, a));
    a = 1.0-a; // for sensible results

    let y = 0;
    if (x<=0.5){
        y = (Math.pow(2.0*x, 1.0/a))/2.0;
    } else {
        y = 1.0 - (Math.pow(2.0*(1.0-x), 1.0/a))/2.0;
    }
    return y;
}

function shuffle(a) {
    let j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

/**
 * @type CanvasRenderingContext2D
 */
let ctx;
let canvas;
let noise
let palette


function getBackgroundGradient(colors)
{
    const { width, height } = config

    const g = ctx.createLinearGradient(0,0,width,0)

    const length = colors.length

    const spreadSize = 16

    const step = 1/((length - 1) * (spreadSize - 1))

    let offset = 0
    for (let i = 0; i < length - 1; i++)
    {
        const colorA = colors[i    ]
        const colorB = colors[i + 1]
        const spread = spectral.palette(colorA, colorB, spreadSize, spectral.HEX)
        for (let j = 0; j < spreadSize-1; j++)
        {
            g.addColorStop(offset, spread[j])

            if (j === spreadSize - 2 || Math.random() < 0.5)
            {
                offset += step
            }
            else
            {
                offset += step/2
                offset += step/2
            }


        }
    }

    return g;
}


function createTemp(width, height)
{
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    return canvas.getContext("2d")
}


function fract(v)
{
    return v - Math.floor(v)
}


domready(
    () => {

        palette = randomPalette()

        canvas = document.getElementById("screen");
        ctx = canvas.getContext("2d");

        const width = (window.innerWidth) | 0;
        const height = (window.innerHeight) | 0;

        config.width = width;
        config.height = height;

        canvas.width = width;
        canvas.height = height;

        const paint = () => {

            noise = createNoise3D()
            palette = randomPalette()

            const colors = palette.concat(palette);
            shuffle(colors)

            const ctx1 = createTemp(width, height)
            ctx1.fillStyle = getBackgroundGradient(colors)
            ctx1.fillRect(0,0, width, height);

            const ctx2 = createTemp(width, height)
            ctx2.fillStyle = palette[0]
            ctx2.fillRect(0,0,width,height)
            const step = Math.floor(width/colors.length)

            const aStep = TAU/step

            let x = 0
            while (x < width)
            {
                let idxA = Math.floor(x / step)
                let idxB = Math.floor(x / step) + 1

                ctx2.fillStyle = Math.random() < 0.5 + 0.65 * Math.sin(x * aStep) ? colors[idxA] : colors[idxB < colors.length ? idxB : 0]

                const y = 0//(-0.5 + Math.random()) * height * 1.2
                ctx2.fillRect(x, y, 1, height)
                x+=1
            }

            const offset = (x,y) => {

                x = wrap(x|0,width-1)
                y = wrap(y|0,height-1)

                return (y * width + x) << 2
            }


            const imageData = ctx.getImageData(0, 0, width, height);
            const imageData1 = ctx1.getImageData(0, 0, width, height);
            const imageData2 = ctx2.getImageData(0, 0, width, height);
            const { data } = imageData
            const { data : src1 } = imageData1
            const { data : src2 } = imageData2
            let off = 0


            const tmp = [0,0,0]
            const getSubPixelColor = (data, x, y) => {

                const srcOff = offset(x,y)
                const srcOff1 = offset(x+1,y)
                const srcOff2 = offset(x,y+1)
                const srcOff3 = offset(x+1,y+1)

                let r0 = data[srcOff]
                let g0 = data[srcOff+1]
                let b0 = data[srcOff+2]
                let r1 = data[srcOff1]
                let g1 = data[srcOff1+1]
                let b1 = data[srcOff1+2]
                let r2 = data[srcOff2]
                let g2 = data[srcOff2+1]
                let b2 = data[srcOff2+2]
                let r3 = data[srcOff3]
                let g3 = data[srcOff3+1]
                let b3 = data[srcOff3+2]

                r0 = r0 * r0
                g0 = g0 * g0
                b0 = b0 * b0
                r1 = r1 * r1
                g1 = g1 * g1
                b1 = b1 * b1
                r2 = r2 * r2
                g2 = g2 * g2
                b2 = b2 * b2
                r3 = r3 * r3
                g3 = g3 * g3
                b3 = b3 * b3

                const fx = fract(x)
                const fy = fract(x)

                r0 = r0 + (r1 - r0) * fx
                g0 = g0 + (g1 - g0) * fx
                b0 = b0 + (b1 - b0) * fx
                r2 = r2 + (r3 - r2) * fx
                g2 = g2 + (g3 - g2) * fx
                b2 = b2 + (b3 - b2) * fx
                r0 = r0 + (r2 - r0) * fy
                g0 = g0 + (g2 - g0) * fy
                b0 = b0 + (b2 - b0) * fy

                tmp[0] = r0
                tmp[1] = g0
                tmp[2] = b0

                return tmp
            }

            const strength = 10
            const ns = (0.001 + 0.005 * Math.random()) * 1.5

            const z0 = Math.random() * 10
            const z1 = Math.random() * 10
            const z2 = Math.random() * 10

            const angle = TAU/12 * Math.floor(Math.random() * 12)

            const angle2 = angle + TAU/8

            const rx0 = Math.cos(angle)
            const ry0 = Math.sin(angle)
            const rx1 = Math.cos(angle2)
            const ry1 = Math.sin(angle2)

            const cx = width >> 1
            const cy = height >> 1

            let t0 = Math.random() * 0.5
            let t1 = 0.5 + Math.random() * 0.5



            const td = (t1 - t0)/height

            for (let y = 0; y < height; y++)
            {
                for (let x = 0; x < width; x++)
                {
                    const x0 = cx + (x-cx) * rx0 + (y-cy) * rx1
                    const y0 = cy + (x-cx) * ry0 + (y-cy) * ry1

                    const u1 = 0.5 + 0.5 * noise(x0 * ns, y0 * ns, z0)
                    const u2 = 0.5 + 0.5 * noise(x0 * ns, y0 * ns, z1)

                    const lat = Math.acos(2*u1-1) - TAU/4
                    const lon = TAU * u2

                    let nx = Math.cos(lat) * Math.cos(lon)
                    let ny = Math.cos(lat) * Math.sin(lon)
                    let nz = Math.sin(lat) 

                    // let d = Math.sqrt(nx * nx + ny * ny + nz * nz)
                    // if (d > 0)
                    // {
                    //     const f = 1 / d
                    //     nx *= f
                    //     ny *= f
                    //     nz *= f
                    // }

                    const x1 = x0 + nx * strength
                    const y1 = y0 + ny * strength

                    const [r0,g0,b0] = getSubPixelColor(src1, x1, y1)
                    const [r1,g1,b1] = getSubPixelColor(src2, x1, y1)

                    const t = doubleExponentialSigmoid(0.5 + 0.5 * nz, 0.666) * t0
                    //const t = 0.5 + 0.5 * nz

                    const r = Math.sqrt(r0 + (r1 - r0) * t)
                    const g = Math.sqrt(g0 + (g1 - g0) * t)
                    const b = Math.sqrt(b0 + (b1 - b0) * t)

                    data[off    ] = r
                    data[off + 1] = g
                    data[off + 2] = b
                    data[off + 3] = 255
                    off += 4
                }

                t0 += td
            }
            ctx.putImageData(imageData,0,0)
            //ctx.drawImage(ctx2.canvas,0,0)

        }

        paint()

        canvas.addEventListener("click", paint, true)
    }
);
