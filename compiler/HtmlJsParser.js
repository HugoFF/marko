'use strict';
var htmljs = require('htmljs-parser');

class HtmlJsParser {
    parse(src, handlers) {
        var listeners = {
            onText(event) {
                handlers.handleCharacters(event.value);
            },

            onPlaceholder(event) {
                if (event.withinBody) {
                    if (!event.withinString) {
                        handlers.handleBodyTextPlaceholder(event.value, event.escape);
                    }
                } else if (event.withinOpenTag) {
                    // Don't escape placeholder for dynamic attributes. For example: <div ${data.myAttrs}></div>
                } else {
                    // placeholder within attribute
                    if (event.escape) {
                        event.value = '$escapeXml(' + event.value + ')';
                    } else {
                        event.value = '$noEscapeXml(' + event.value + ')';
                    }
                }
                // placeholder within content

            },

            onCDATA(event) {
                handlers.handleCharacters(event.value);
            },

            onOpenTag(event, parser) {
                event.selfClosed = false; // Don't allow self-closed tags
                handlers.handleStartElement(event);

                var newParserState = handlers.getParserStateForTag(event);
                if (newParserState) {
                    if (newParserState === 'parsed-text') {
                        parser.enterParsedTextContentState();
                    } else if (newParserState === 'static-text') {
                        parser.enterStaticTextContentState();
                    }
                }
            },

            onCloseTag(event) {
                var tagName = event.tagName;
                handlers.handleEndElement(tagName);
            },

            onDocumentType(event) {

                // Document type: <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd
                // NOTE: The value will be all of the text between "<!" and ">""
                handlers.handleCharacters('<!' + event.value + '>');
            },

            onDeclaration(event) {
                // Declaration (e.g. <?xml version="1.0" encoding="UTF-8" ?>)
                handlers.handleCharacters('<?' + event.value + '?>');
            },

            onComment(event) {
                // Text within XML comment
                handlers.handleComment(event.value);
            },

            onError(event) {
                handlers.handleError(event);
            }
        };

        var parser = this.parser = htmljs.createParser(listeners);
        parser.parse(src);
    }
}

module.exports = HtmlJsParser;