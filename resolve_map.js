const fs = require('fs');
const sourceMap = require('source-map');

async function resolve() {
    const rawSourceMap = fs.readFileSync('build/static/js/main.185e0004.chunk.js.map', 'utf8');
    const consumer = await new sourceMap.SourceMapConsumer(rawSourceMap);
    
    const pos = consumer.originalPositionFor({
        line: 1,
        column: 19874
    });
    
    console.log("Resolved position:");
    console.log(pos);
    
    consumer.destroy();
}

resolve().catch(console.error);
