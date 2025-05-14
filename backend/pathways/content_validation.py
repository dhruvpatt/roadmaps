import json
import re
from bs4 import BeautifulSoup
from html.parser import HTMLParser


class HTMLValidationError(Exception):
    pass


class HTMLValidator(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = []
        self.errors = []

    def handle_starttag(self, tag, attrs):
        if tag not in ['br', 'img', 'input', 'hr', 'meta', 'link']:
            self.tags.append(tag)

    def handle_endtag(self, tag):
        if tag not in ['br', 'img', 'input', 'hr', 'meta', 'link']:
            if self.tags and self.tags[-1] == tag:
                self.tags.pop()
            else:
                self.errors.append(f"Mismatched tag: {tag}")

    def check_errors(self):
        if self.tags:
            self.errors.append(f"Unclosed tags: {', '.join(self.tags)}")
        return self.errors


def validate_html(html_content):
    """Validate HTML content for common rendering issues"""
    errors = []

    # Check for balanced tags
    validator = HTMLValidator()
    validator.feed(html_content)
    tag_errors = validator.check_errors()
    errors.extend(tag_errors)

    # Check for script tags (might cause security issues)
    if re.search(r'<script\b[^>]*>(.*?)</script>', html_content, re.DOTALL):
        errors.append("Script tags detected - may cause security issues")

    # Try parsing with BeautifulSoup to catch other issues
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        soup_errors = soup.find_all(text=lambda text: isinstance(text, str) and bool(re.search(r'[<>]', text)))
        if soup_errors:
            errors.append("Potential unclosed tags or brackets in content")
    except Exception as e:
        errors.append(f"HTML parsing error: {str(e)}")

    # Check for common CSS issues in style tags
    style_tags = re.findall(r'<style\b[^>]*>(.*?)</style>', html_content, re.DOTALL)
    for style in style_tags:
        if '{' in style and style.count('{') != style.count('}'):
            errors.append("Unbalanced CSS braces in style tag")

    return errors


def validate_json_content(content_list):
    """Validate content items in the content list"""
    errors = []
    try:
        content_data = json.loads(content_list) if isinstance(content_list, str) else content_list

        if not isinstance(content_data, list):
            errors.append("Content must be a list of items")
            return errors

        for i, item in enumerate(content_data):
            if not isinstance(item, dict):
                errors.append(f"Item {i} is not a dictionary")
                continue

            if 'type' not in item:
                errors.append(f"Item {i} missing 'type' field")
            elif item['type'] not in ['html', 'content', 'video']:
                errors.append(f"Item {i} has invalid type: {item['type']}")

            if 'content' not in item:
                errors.append(f"Item {i} missing 'content' field")
            elif not item['content']:
                errors.append(f"Item {i} has empty content")

            # Check HTML content specifically
            if item.get('type') == 'html':
                html_errors = validate_html(item['content'])
                for error in html_errors:
                    errors.append(f"HTML Error in item {i}: {error}")

    except json.JSONDecodeError as e:
        errors.append(f"Invalid JSON format: {str(e)}")
    except Exception as e:
        errors.append(f"Validation error: {str(e)}")

    return errors
