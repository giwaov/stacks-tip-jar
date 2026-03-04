import { Twitter, Share2, Link } from 'lucide-react';
import { Button } from './Button';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';

interface SocialShareProps {
  url?: string;
  title?: string;
}

export function SocialShare({ 
  url = typeof window !== 'undefined' ? window.location.href : '',
  title = 'Support me on STX Tip Jar!'
}: SocialShareProps) {
  const { copied, copy } = useCopyToClipboard();

  const shareTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" onClick={shareTwitter} aria-label="Share on Twitter">
        <Twitter className="w-5 h-5" />
      </Button>
      
      {typeof navigator !== 'undefined' && navigator.share && (
        <Button variant="ghost" onClick={shareNative} aria-label="Share">
          <Share2 className="w-5 h-5" />
        </Button>
      )}
      
      <Button 
        variant="ghost" 
        onClick={() => copy(url)} 
        aria-label="Copy link"
      >
        <Link className="w-5 h-5" />
        {copied && <span className="ml-2 text-xs text-green-400">Copied!</span>}
      </Button>
    </div>
  );
}
