"""Read public Instagram posts through Instaloader and emit bounded JSON."""

import json
import sys

import instaloader


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: instagram-instaloader.py PROFILE LIMIT")
    profile_name, raw_limit = sys.argv[1:]
    limit = min(max(int(raw_limit), 1), 50)
    loader = instaloader.Instaloader(
        download_pictures=False,
        download_videos=False,
        download_video_thumbnails=False,
        download_geotags=False,
        download_comments=False,
        save_metadata=False,
        compress_json=False,
        quiet=True,
    )
    profile = instaloader.Profile.from_username(loader.context, profile_name)
    posts = []
    for index, post in enumerate(profile.get_posts()):
        if index >= limit:
            break
        images = []
        if post.typename == "GraphImage":
            images.append(post.url)
        elif post.typename == "GraphSidecar":
            images.extend(node.display_url for node in post.get_sidecar_nodes() if not node.is_video)
        posts.append({
            "shortcode": post.shortcode,
            "url": f"https://www.instagram.com/p/{post.shortcode}/",
            "caption": post.caption or "",
            "publishedAt": post.date_utc.isoformat() + "Z",
            "images": images[:4],
        })
    print(json.dumps(posts, ensure_ascii=False))


if __name__ == "__main__":
    main()
