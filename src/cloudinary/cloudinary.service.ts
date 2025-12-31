import { Injectable } from '@nestjs/common';
import { UploadApiResponse, UploadApiErrorResponse, v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
    async uploadImage(
        file: Express.Multer.File,
        folder: string = 'takwirti/complexes'
    ): Promise<UploadApiResponse> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: folder,
                    resource_type: 'auto',
                    transformation: [
                        { width: 1920, height: 1080, crop: 'limit' },
                        { quality: 'auto:good' },
                        { fetch_format: 'auto' }
                    ]
                },
                (error, result) => {
                    if (error) return reject(error);
                    if (!result) return reject(new Error('Cloudinary upload failed: No result returned'));
                    resolve(result);
                },
            );

            streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
    }

    async deleteImage(publicId: string): Promise<any> {
        return cloudinary.uploader.destroy(publicId);
    }

    // Extract public_id from Cloudinary URL for deletion
    extractPublicId(url: string): string {
        const parts = url.split('/');
        const filename = parts[parts.length - 1];
        const publicId = filename.split('.')[0];
        // Include folder path
        const folderIndex = parts.indexOf('takwirti');
        if (folderIndex !== -1) {
            return parts.slice(folderIndex, parts.length - 1).join('/') + '/' + publicId;
        }
        return publicId;
    }
}
