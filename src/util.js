export function clamp(v,min=0,max=1)
{
    return v < min ? min : v > max ? max : v;
}

export function wrap(n, max)
{
    const m = n % max
    if (m < 0)
    {
        return max + m
    }
    else
    {
        return Math.abs(m)
    }
}
