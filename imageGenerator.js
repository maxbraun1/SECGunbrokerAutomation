import sharp from 'sharp';
import download from 'image-downloader';
import chalk from 'chalk';

async function generateImages(url){
    return new Promise(async (resolve, reject) => {
        let options = {
            url: url,
            dest: '../../tmp/tmp.jpeg',
            timeout: 2000,
        };

        await download.image(options)
        .then( async ({ filename }) => {
            try{
                sharp.cache(false);
                let template = sharp("tmp/template.jpg");
                let tmpBuffer = await sharp('tmp/tmp.jpeg').resize({ width: 950 }).toBuffer();
                await sharp(tmpBuffer).toFile('tmp/tmp.jpeg');
                template.composite([
                    { input: 'tmp/tmp.jpeg' }, { input: 'tmp/text.png', gravity: 'south'}
                ]);
                await template.toFile('tmp/thumbnail.jpeg');
                resolve();
            }catch (error) {
                // Catch Image Editing Errors
                reject(error);
            }
        }).catch((error) => {
            // Catch Image Download Errors
            reject(error);
        });
    });
}

export {generateImages};