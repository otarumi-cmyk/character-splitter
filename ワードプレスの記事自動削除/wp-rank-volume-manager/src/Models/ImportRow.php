<?php

namespace WP_Rank_Volume_Manager\Models;

/**
 * Represents one imported CSV row.
 * Constructor accepts either an associative array (mapped from CSV header)
 * or individual parameters.
 */
class ImportRow {
    private $url;
    private $keyword;
    private $rank;
    private $keywordVolume;

    /**
     * Accepts either: new ImportRow($url, $keyword, $rank, $volume)
     * or new ImportRow([ 'url' => ..., 'keyword' => ..., 'rank' => ..., 'volume' => ... ])
     * The keys are case-insensitive and will try several common header names.
     */
    public function __construct($a, $keyword = null, $rank = null, $keywordVolume = null) {
        if (is_array($a)) {
            $row = $a;
            // normalize keys to lower-case
            $norm = [];
            foreach ($row as $k => $v) {
                $norm[strtolower(trim($k))] = $v;
            }

            $this->url = $this->findFirst($norm, ['url', 'link', 'page_url', 'page url', 'page-url']);
            $this->keyword = $this->findFirst($norm, ['keyword', 'キーワード', 'keyword_phrase']);
            $this->rank = (int) $this->findFirst($norm, ['rank', '順位', 'position']) ?: 0;
            $this->keywordVolume = (int) $this->findFirst($norm, ['volume', 'keyword_volume', 'キーワードボリューム', 'search_volume']) ?: 0;
        } else {
            $this->url = $a;
            $this->keyword = $keyword;
            $this->rank = (int) $rank;
            $this->keywordVolume = (int) $keywordVolume;
        }
    }

    private function findFirst(array $arr, array $candidates) {
        foreach ($candidates as $c) {
            $key = strtolower($c);
            if (isset($arr[$key]) && $arr[$key] !== '') {
                return $arr[$key];
            }
        }
        return null;
    }

    public function getUrl() {
        return $this->url;
    }

    public function getKeyword() {
        return $this->keyword;
    }

    public function getRank() {
        return $this->rank;
    }

    public function getKeywordVolume() {
        return $this->keywordVolume;
    }
}