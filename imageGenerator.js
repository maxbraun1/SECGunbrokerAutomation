import sharp from 'sharp';
import download from 'image-downloader';
import chalk from 'chalk';
import fs from 'fs';

async function generateImages(url){
    return new Promise(async (resolve, reject) => {
        let options = {
            url: url,
            dest: '../../tmp/tmp.jpeg',
            timeout: 2000,
        };

        await download.image(options)
        .then( async () => {
            try{
                sharp.cache(false);

                let template = sharp("tmp/template.jpg");
                let buffer = await sharp('tmp/tmp.jpeg').resize(930, 680, { fit: sharp.fit.inside }).toBuffer();
                
                await sharp(buffer).toFile("tmp/tmp.jpeg");

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