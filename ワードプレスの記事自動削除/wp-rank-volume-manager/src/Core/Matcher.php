<?php

namespace WP_Rank_Volume_Manager\Core;

class Matcher {
    private $articlesData;

    public function __construct(array $articlesData) {
        $this->articlesData = $articlesData;
    }

    public function matchArticles(array $criteria) {
        $matchedArticles = [];

        foreach ($this->articlesData as $article) {
            if ($this->matchesCriteria($article, $criteria)) {
                $matchedArticles[] = $article;
            }
        }

        return $matchedArticles;
    }

    private function matchesCriteria(array $article, array $criteria) {
        $matches = true;

        if (isset($criteria['rank_threshold']) && $article['rank'] <= $criteria['rank_threshold']) {
            $matches = false;
        }

        if (isset($criteria['volume_threshold']) && $article['volume'] >= $criteria['volume_threshold']) {
            $matches = false;
        }

        return $matches;
    }
}