import Image from 'next/image';
import { useState, useCallback } from 'react';
import { Book } from '../AddBookModal';

interface MediaPublisherSectionProps {
  book: Book;
  setBook: (book: Book) => void;
}

const MAX_COVER_IMAGES = 5;
const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/gif';

export default function MediaPublisherSection({ 
  book, 
  setBook 
}: MediaPublisherSectionProps) {
  const [imageUploadError, setImageUploadError] = useState<string>('');

  const handleCoverImagesChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setImageUploadError('');

    if (files.length === 0) return;

    // Validate file types
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      setImageUploadError('Please select only image files.');
      return;
    }

    // Validate file sizes (max 5MB per file)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setImageUploadError('Each image must be smaller than 5MB.');
      return;
    }

    const limitedFiles = files.slice(0, MAX_COVER_IMAGES);
    
    if (files.length > MAX_COVER_IMAGES) {
      setImageUploadError(`Only the first ${MAX_COVER_IMAGES} images were selected.`);
    }

    setBook({ 
      ...book, 
      display_images: limitedFiles 
    });
  }, [book, setBook]);

  const handleRemoveImage = useCallback((indexToRemove: number) => {
    if (!book.display_images) return;
    
    const updatedImages = book.display_images.filter((_, index) => index !== indexToRemove);
    setBook({ 
      ...book, 
      display_images: updatedImages 
    });
  }, [book, setBook]);

  const handlePublisherChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setBook({ 
      ...book, 
      publisher: event.target.value 
    });
  }, [book, setBook]);

  return (
    <section 
      className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100 transition-shadow hover:shadow-lg"
      aria-labelledby="media-publisher-heading"
    >
      <header className="flex items-center gap-2 mb-6 text-gray-900">
        <div className="relative w-5 h-5" aria-hidden="true">
          <Image
            src="/images/icons/media.svg"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <h3 id="media-publisher-heading" className="font-medium text-lg">
          Media & Publisher
        </h3>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cover Images Upload Section */}
        <div className="space-y-4">
          <div className="relative">
            <label 
              htmlFor="cover-images-upload" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Cover Images 
              <span className="text-gray-500 text-xs ml-1">
                (max {MAX_COVER_IMAGES}, up to 5MB each)
              </span>
            </label>
            
            <input
              id="cover-images-upload"
              type="file"
              accept={ACCEPTED_IMAGE_TYPES}
              multiple
              onChange={handleCoverImagesChange}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 
                         focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 
                         transition-colors bg-gray-50 focus:bg-white
                         file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 
                         file:text-sm file:bg-indigo-50 file:text-indigo-700 
                         hover:file:bg-indigo-100"
              aria-describedby={imageUploadError ? "upload-error" : undefined}
              required
            />

            {imageUploadError && (
              <p id="upload-error" className="text-red-600 text-sm mt-1" role="alert">
                {imageUploadError}
              </p>
            )}
          </div>

          {/* Image Previews */}
          {book.display_images && book.display_images.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Selected images ({book.display_images.length})
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {book.display_images.map((file, index) => (
                  <div 
                    key={`${file.name}-${index}`}
                    className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 
                               bg-gray-100 group hover:shadow-md transition-shadow"
                  >
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={`Cover preview ${index + 1}: ${file.name}`}
                      className="object-cover w-full h-full"
                      fill
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full 
                                 w-6 h-6 flex items-center justify-center text-xs font-bold
                                 opacity-0 group-hover:opacity-100 hover:bg-red-600 
                                 transition-opacity focus:opacity-100 focus:outline-none 
                                 focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                      title={`Remove ${file.name}`}
                      aria-label={`Remove image ${index + 1}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Publisher Input Section */}
        <div className="space-y-4 self-start">
          <div className="space-y-1">
            <label htmlFor="publisher-input" className="block text-sm font-medium text-gray-700">
              Publisher *
            </label>
            <input
              type="text"
              id="publisher-input"
              value={book.publisher || ''}
              onChange={handlePublisherChange}
              placeholder="Enter publisher name"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 \
                         focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 \
                         transition-colors bg-gray-50 focus:bg-white"
              required
              aria-label="Publisher name"
            />
          </div>
          
          <p className="text-xs text-gray-500">
            Enter the name of the book&apos;s publisher or publishing house.
          </p>
        </div>
      </div>
    </section>
  );
}