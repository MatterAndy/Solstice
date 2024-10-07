import asteroidData from "../../static/sbdb_query_results.json";

export class Asteroid {
    name: string;
    radius: number;
    e: number;
    sma: number;
    i: number;
    node: number;
    per: number;
    day: number;
}

export const getAsteroids = (): Asteroid[] => {
    let asteroids: Asteroid[] = [];
    for (const singleAsteroidData of asteroidData) {
        if (singleAsteroidData.diameter === null) { continue; }
        if (singleAsteroidData.rot_per === null) { continue; }

        let asteroid: Asteroid = new Asteroid;
        
        asteroid.name = singleAsteroidData.full_name;
        asteroid.name.trim();
        
        asteroid.radius = singleAsteroidData.diameter / 2;
        asteroid.radius = 0.3257 * Math.log(asteroid.radius) - 2.2167;
        if (asteroid.radius <= 0) { asteroid.radius = 0.1; }
        
        asteroid.e = singleAsteroidData.e;
        
        asteroid.sma = singleAsteroidData.a;
        asteroid.sma *= 1.1629 * Math.pow(asteroid.sma, -0.156);
        
        asteroid.i = singleAsteroidData.i;
        asteroid.node = singleAsteroidData.om;
        asteroid.per = singleAsteroidData.per;
        asteroid.day = singleAsteroidData.rot_per;

        asteroids.push(asteroid);
    }
    return asteroids;
}