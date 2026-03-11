<?php

namespace WP_Rank_Volume_Manager\Core;

class RuleEvaluator {
    private $rankThreshold;
    private $volumeThreshold;
    private $logic;

    public function __construct($rankThreshold, $volumeThreshold, $logic) {
        $this->rankThreshold = $rankThreshold;
        $this->volumeThreshold = $volumeThreshold;
        $this->logic = $logic;
    }

    public function evaluate($articleRank, $articleVolume) {
        if ($this->logic === 'AND') {
            return $articleRank >= $this->rankThreshold && $articleVolume <= $this->volumeThreshold;
        } elseif ($this->logic === 'OR') {
            return $articleRank >= $this->rankThreshold || $articleVolume <= $this->volumeThreshold;
        }
        return false;
    }

    public function getRankThreshold() {
        return $this->rankThreshold;
    }

    public function getVolumeThreshold() {
        return $this->volumeThreshold;
    }

    public function getLogic() {
        return $this->logic;
    }
}